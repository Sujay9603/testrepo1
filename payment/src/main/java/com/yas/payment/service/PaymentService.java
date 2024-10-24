package com.yas.payment.service;

import com.yas.payment.model.CapturedPayment;
import com.yas.payment.model.InitiatedPayment;
import com.yas.payment.model.Payment;
import com.yas.payment.model.enumeration.PaymentMethod;
import com.yas.payment.model.enumeration.PaymentStatus;
import com.yas.payment.repository.PaymentRepository;
import com.yas.payment.service.provider.handler.PaymentHandler;
import com.yas.payment.viewmodel.*;
import jakarta.annotation.PostConstruct;
import com.yas.payment.viewmodel.CheckoutPaymentVm;
import com.yas.payment.viewmodel.PaymentOrderStatusVm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {


    private static final Logger LOGGER = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;

    private final OrderService orderService;
    private final Map<String, PaymentHandler> providers = new HashMap<>();

    @Autowired
    private final List<PaymentHandler> paymentHandlers;

    @PostConstruct
    public void initializeProviders() {
        for (PaymentHandler handler : paymentHandlers) {
            providers.put(handler.getProviderId(), handler);
        }
    }

    private PaymentHandler getPaymentHandler(String providerName) {
        PaymentHandler handler = providers.get(providerName);
        if (handler == null) {
            throw new IllegalArgumentException("No payment handler found for provider: " + providerName);
        }
        return handler;
    }

    public InitPaymentResponseVm initPayment(InitPaymentRequestVm initPaymentRequestVm) {
        PaymentHandler paymentHandler = getPaymentHandler(initPaymentRequestVm.paymentMethod());
        InitiatedPayment initiatedPayment = paymentHandler.initPayment(initPaymentRequestVm);
        return InitPaymentResponseVm.builder()
                .status(initiatedPayment.getStatus())
                .paymentId(initiatedPayment.getPaymentId())
                .redirectUrl(initiatedPayment.getRedirectUrl())
                .build();
    }

    public CapturePaymentResponseVm capturePayment(CapturePaymentRequestVm capturePaymentRequestVM) {
        PaymentHandler paymentHandler = getPaymentHandler(capturePaymentRequestVM.paymentMethod());
        CapturedPayment capturedPayment = paymentHandler.capturePayment(capturePaymentRequestVM);
        Long orderId = orderService.updateCheckoutStatus(capturedPayment);
        capturedPayment.setOrderId(orderId);
        Payment payment = createPayment(capturedPayment);
        PaymentOrderStatusVm orderPaymentStatusVm =
                PaymentOrderStatusVm.builder()
                        .paymentId(payment.getId())
                        .orderId(payment.getOrderId())
                        .paymentStatus(payment.getPaymentStatus().name())
                        .build();
        orderService.updateOrderStatus(orderPaymentStatusVm);
        return CapturePaymentResponseVm.builder()
                .orderId(capturedPayment.getOrderId())
                .checkoutId(capturedPayment.getCheckoutId())
                .amount(capturedPayment.getAmount())
                .paymentFee(capturedPayment.getPaymentFee())
                .gatewayTransactionId(capturedPayment.getGatewayTransactionId())
                .paymentMethod(capturedPayment.getPaymentMethod())
                .paymentStatus(capturedPayment.getPaymentStatus())
                .failureMessage(capturedPayment.getFailureMessage())
                .build();
    }

    private Payment createPayment(CapturedPayment capturedPayment) {
        Payment payment = Payment.builder()
                .checkoutId(capturedPayment.getCheckoutId())
                .orderId(capturedPayment.getOrderId())
                .paymentStatus(capturedPayment.getPaymentStatus())
                .paymentFee(capturedPayment.getPaymentFee())
                .paymentMethod(capturedPayment.getPaymentMethod())
                .amount(capturedPayment.getAmount())
                .failureMessage(capturedPayment.getFailureMessage())
                .gatewayTransactionId(capturedPayment.getGatewayTransactionId())
                .build();
        return paymentRepository.save(payment);
    }

    public Long createPaymentFromEvent(CheckoutPaymentVm checkoutPaymentVm) {

        Payment payment = Payment.builder()
            .checkoutId(checkoutPaymentVm.checkoutId())
            .paymentStatus(
                PaymentMethod.COD.equals(checkoutPaymentVm.paymentMethod())
                    ? PaymentStatus.NEW : PaymentStatus.PROCESSING
            )
            .paymentMethod(checkoutPaymentVm.paymentMethod())
            .amount(checkoutPaymentVm.totalAmount())
            .build();

        Payment createdPayment = paymentRepository.save(payment);

        LOGGER.info("Payment is created successfully with ID: {}", createdPayment.getId());

        return createdPayment.getId();
    }
}
