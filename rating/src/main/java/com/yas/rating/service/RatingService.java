package com.yas.rating.service;

import com.yas.rating.exception.NotFoundException;
import com.yas.rating.model.Rating;
import com.yas.rating.repository.RatingRepository;
import com.yas.rating.utils.Constants;
import com.yas.rating.viewmodel.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class RatingService {
    private final RatingRepository ratingRepository;
    private final ProductService productService;
    private final CustomerService customerService;

    public RatingService(RatingRepository ratingRepository, ProductService productService, CustomerService customerService) {
        this.ratingRepository = ratingRepository;
        this.productService = productService;
        this.customerService = customerService;
    }

    public RatingListVm getRatingListByProductId(Long id, int pageNo, int pageSize) {
        if (productService.getProductById(id) == null) {
            throw new NotFoundException(Constants.ERROR_CODE.PRODUCT_NOT_FOUND, id);
        }

        Pageable pageable = PageRequest.of(pageNo, pageSize, Sort.by("createdOn").descending());
        Page<Rating> ratings = ratingRepository.findByProductId(id, pageable);

        List<RatingVm> ratingVmList = new ArrayList<>();
        for (Rating rating : ratings.getContent()) {
            ratingVmList.add(RatingVm.fromModel(rating));
        }

        return new RatingListVm(ratingVmList, ratings.getTotalElements(), ratings.getTotalPages());
    }

    public RatingVm createRating(RatingPostVm ratingPostVm) {
       if(productService.updateAverageStar(ratingPostVm.productId(), ratingPostVm.star()) == null){
           throw new NotFoundException(Constants.ERROR_CODE.PRODUCT_NOT_FOUND, ratingPostVm.productId());
       };

        Rating rating = new Rating();
        CustomerVm customerVm = customerService.getCustomer();

        rating.setLastName(customerVm.lastName());
        rating.setFirstName(customerVm.firstName());
        rating.setRatingStar(ratingPostVm.star());
        rating.setContent(ratingPostVm.content());
        rating.setProductId(ratingPostVm.productId());

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        rating.setCreatedBy(auth.getName());
        rating.setLastModifiedBy(auth.getName());

        Rating savedRating = ratingRepository.saveAndFlush(rating);
        return RatingVm.fromModel(savedRating);
    }

}
