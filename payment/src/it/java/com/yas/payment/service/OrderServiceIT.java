package com.yas.payment.service;

import static com.yas.payment.constant.TestConstants.CIRCUIT_BREAKER_NAME;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.yas.payment.model.enumeration.PaymentMethod;
import com.yas.payment.model.enumeration.PaymentStatus;
import com.yas.payment.viewmodel.CapturedPayment;
import com.yas.payment.viewmodel.PaymentOrderStatusVm;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class OrderServiceIT {
    @Autowired
    private OrderService orderService;
    @Autowired
    private CircuitBreakerRegistry circuitBreakerRegistry;

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgresContainer = new PostgreSQLContainer<>("postgres:16");

    @Test
    void test_updateCheckoutStatus_shouldThrowCallNotPermittedException_whenCircuitBreakerIsOpen() {
        CapturedPayment capturedPayment = CapturedPayment.builder()
            .orderId(2L)
            .checkoutId("checkoutId")
            .amount(BigDecimal.valueOf(100.0))
            .paymentFee(BigDecimal.valueOf(500))
            .gatewayTransactionId("gatewayTransactionId")
            .paymentMethod(PaymentMethod.BANKING)
            .paymentStatus(PaymentStatus.COMPLETED)
            .failureMessage(null)
            .build();
        circuitBreakerRegistry.circuitBreaker(CIRCUIT_BREAKER_NAME).transitionToOpenState();
        assertThrows(CallNotPermittedException.class, () -> orderService.updateCheckoutStatus(capturedPayment));
    }

    @Test
    void test_updateOrderStatus_shouldThrowCallNotPermittedException_whenCircuitBreakerIsOpen() {
        PaymentOrderStatusVm paymentOrderStatusVm = PaymentOrderStatusVm.builder()
            .orderId(2L)
            .orderStatus("orderStatus")
            .paymentId(1L)
            .paymentStatus("paymentStatus")
            .build();
        circuitBreakerRegistry.circuitBreaker(CIRCUIT_BREAKER_NAME).transitionToOpenState();
        assertThrows(CallNotPermittedException.class, () -> orderService.updateOrderStatus(paymentOrderStatusVm));
    }
}