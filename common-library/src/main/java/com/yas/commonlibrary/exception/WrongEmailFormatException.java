package com.yas.commonlibrary.exception;

import com.yas.commonlibrary.utils.MessagesUtils;

public class WrongEmailFormatException extends RuntimeException {

    private String message;

    public WrongEmailFormatException(String errorCode, Object... var2) {
        this.message = MessagesUtils.getMessage(errorCode, var2);
    }

    @Override
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
