package com.yas.product.viewmodel.product;

import com.yas.product.model.Category;
import com.yas.product.viewmodel.ImageVm;
import java.util.List;

public record ProductDetailVm(
        long id,
        String name,
        String shortDescription,
        String description,
        String specification,
        String sku,
        String gtin,
        String slug,
        Boolean isAllowedToOrder,
        Boolean isPublished,
        Boolean isFeatured,
        Boolean isVisible,
        Boolean stockTrackingEnabled,
        Double weight,
        Double length,
        Double width,
        Double height,
        Double price,
        Long brandId,
        List<Category> categories,
        String metaTitle,
        String metaKeyword,
        String metaDescription,
        ImageVm thumbnailMedia,
        List<ImageVm> productImageMedias,
        Long taxClassId) {
}
