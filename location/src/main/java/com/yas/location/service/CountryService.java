package com.yas.location.service;

import com.yas.location.exception.DuplicatedException;
import com.yas.location.exception.NotFoundException;
import com.yas.location.model.Country;
import com.yas.location.utils.Constants;
import com.yas.location.repository.CountryRepository;
import com.yas.location.viewmodel.country.CountryPostVm;
import com.yas.location.viewmodel.country.CountryVm;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class CountryService {
    private final CountryRepository countryRepository;

    public CountryService(CountryRepository countryRepository) {

        this.countryRepository = countryRepository;
    }

    public Country create(CountryPostVm countryPostVm) {
        if (countryRepository.existsByName(countryPostVm.name())) {
            throw new DuplicatedException(Constants.ERROR_CODE.NAME_ALREADY_EXITED, countryPostVm.name());
        }
        return countryRepository.save(countryPostVm.toModel());
    }

    public Country update(CountryPostVm countryPostVm, Long id) {
        //For the updating case we we don't need to check for the country being updated
        if (countryRepository.existsByNameNotUpdatingCountry(countryPostVm.name(), id)) {
            throw new DuplicatedException(Constants.ERROR_CODE.NAME_ALREADY_EXITED, countryPostVm.name());
        }
        Country country = countryRepository
                .findById(id)
                .orElseThrow(() -> new NotFoundException(Constants.ERROR_CODE.COUNTRY_NOT_FOUND, id));

        country.setName(countryPostVm.name());
        country.setCode3(countryPostVm.code3());
        country.setIsBillingEnabled(countryPostVm.isBillingEnabled());
        country.setIsShippingEnabled(countryPostVm.isShippingEnabled());
        country.setIsCityEnabled(countryPostVm.isCityEnabled());
        country.setIsZipCodeEnabled(countryPostVm.isZipCodeEnabled());
        country.setIsDistrictEnabled(countryPostVm.isDistrictEnabled());

        return countryRepository.save(country);
    }
}


