package com.yas.order.model.request;

import com.yas.order.model.enumeration.OrderStatus;
import java.time.ZonedDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderRequest {

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private ZonedDateTime createdFrom;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private ZonedDateTime createdTo;

    private String warehouse;
    private String productName;
    private List<OrderStatus> orderStatus;
    private String billingPhoneNumber;
    private String email;
    private String billingCountry;
    private int pageNo;
    private int pageSize;
}
