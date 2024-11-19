import { Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Order } from '@/modules/order/models/Order';
import CheckOutDetail from 'modules/order/components/CheckOutDetail';
import { OrderItem } from '@/modules/order/models/OrderItem';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Input } from 'common/items/Input';
import { Address } from '@/modules/address/models/AddressModel';
import AddressForm from '@/modules/address/components/AddressForm';
import { getCheckoutById, processPayment } from '@/modules/order/services/OrderService';
import * as yup from 'yup';
import {
  createUserAddress,
  getUserAddressDefault,
} from '@/modules/customer/services/CustomerService';
import ModalAddressList from '@/modules/order/components/ModalAddressList';
import CheckOutAddress from '@/modules/order/components/CheckOutAddress';
import type { Checkout } from '@/modules/order/models/Checkout';
import { toastError } from '@/modules/catalog/services/ToastService';
import { CheckoutItem } from '@/modules/order/models/CheckoutItem';
import SpinnerComponent from '@/common/components/SpinnerComponent';
import { getPaymentById } from '@/modules/payment/services/PaymentService';
import { Payment } from '@/modules/payment/models/Payment';
import { ECheckoutState } from '@/modules/order/models/ECheckoutState';
import { ECheckoutProgress } from '@/modules/order/models/ECheckoutProgress';
import { EPaymentStatus } from '@/modules/payment/models/EPaymentStatus';

const phoneRegExp =
  /^((\+[1-9]{1,4}[ -]*)|(\([0-9]{2,3}\)[ -]*)|[0-9]{2,4}[ -]*)?[0-9]{3,4}?[ -]*[0-9]{3,4}?$/;
const addressSchema = yup.object().shape({
  zipCode: yup.string().required('Zip code is required'),
  addressLine1: yup.string().required('Address is required'),
  districtId: yup.string().required('District is required'),
  stateOrProvinceId: yup.string().required('State or province is required'),
  countryId: yup.string().required('Country is required'),
  phone: yup.string().matches(phoneRegExp, 'Phone number is not valid'),
  contactName: yup.string().required('Contact name is required'),
});

const Checkout = () => {
  const router = useRouter();
  const { id } = router.query;
  const [checkout, setCheckout] = useState<Checkout>();

  const CREATE_PAYMENT_TIMEOUT = 10;
  const elapsedTimeRef = useRef(0);
  let intervalId: NodeJS.Timeout | undefined;

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
  } = useForm<Order>();
  const {
    register: registerShippingAddress,
    setValue: setValueShippingAddress,
    formState: { errors: errorsShippingAddress },
    watch: watchShippingAddress,
  } = useForm<Address>();

  const {
    register: registerBillingAddress,
    setValue: setValueBillingAddress,
    formState: { errors: errorsBillingAddress },
    watch: watchBillingAddress,
  } = useForm<Address>();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  let order = watch();

  const [shippingAddress, setShippingAddress] = useState<Address>();
  const [billingAddress, setBillingAddress] = useState<Address>();

  const [sameAddress, setSameAddress] = useState<boolean>(true);
  const [addShippingAddress, setAddShippingAddress] = useState<boolean>(false);
  const [addBillingAddress, setAddBillingAddress] = useState<boolean>(false);
  const [showModalShipping, setModalShipping] = useState<boolean>(false);
  const [showModalBilling, setModalBilling] = useState<boolean>(false);
  const [isShowSpinner, setIsShowSpinner] = useState(false);
  const [disableProcessPayment, setDisableProcessPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const handleCloseModalShipping = () => {
    if (shippingAddress?.id == null || shippingAddress.id == undefined) setAddShippingAddress(true);
    setModalShipping(false);
  };
  const handleCloseModalBilling = () => {
    if (billingAddress?.id == shippingAddress?.id) setSameAddress(true);
    setModalBilling(false);
  };

  useEffect(() => {
    getUserAddressDefault()
      .then((res) => {
        setShippingAddress(res);
        setBillingAddress(res);
      })
      .catch((e) => {
        setAddShippingAddress(true);
      });
  }, []);

  useEffect(() => {
    if (id) {
      const fetchCheckout = async () => {
        await getCheckoutById(id as string)
          .then((res) => {
            setCheckout(res);
            const newItems: OrderItem[] = [];
            res.checkoutItemVms.forEach((result: CheckoutItem) => {
              newItems.push({
                productId: result.productId,
                quantity: result.quantity,
                productName: result.productName,
                productPrice: result.productPrice!,
                discountAmount: result.discountAmount,
                taxAmount: result.taxAmount,
              });
            });
            setOrderItems(newItems);
          })
          .catch((err) => {
            if (err == 404) {
              toastError('Page not found');
              router.push({ pathname: `/404` }); //NOSONAR
            } else {
              toastError('Please login to continue');
              router.push({ pathname: `/login` }); //NOSONAR
            }
          });
      };

      fetchCheckout(); //NOSONAR
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSelectShippingAddress = (address: Address) => {
    setShippingAddress(address);
  };
  const handleSelectBillingAddress = (address: Address) => {
    setBillingAddress(address);
  };

  const handleSaveNewAddress = (data: Address) => {
    createUserAddress(data).catch((e) => {
      toast.error('Save new address failed!');
    });
  };

  const onSubmitForm: SubmitHandler<Order> = async (data) => {
    let isValidate = true;

    if (addShippingAddress) {
      await addressSchema
        .validate(watchShippingAddress())
        .then(() => {
          handleSaveNewAddress(watchShippingAddress());
          order.shippingAddressPostVm = watchShippingAddress();
        })
        .catch((error) => {
          toast.error(error.message);
          isValidate = false;
        });
    } else if (shippingAddress) {
      order.shippingAddressPostVm = shippingAddress;
    }

    //handle BillingAddress
    if (addBillingAddress) {
      await addressSchema
        .validate(watchBillingAddress())
        .then(() => {
          handleSaveNewAddress(watchBillingAddress());
          order.billingAddressPostVm = watchBillingAddress();
        })
        .catch((error) => {
          toast.error(error.message);
          isValidate = false;
        });
    } else if (sameAddress) {
      order.billingAddressPostVm = order.shippingAddressPostVm;
    } else if (billingAddress) {
      order.billingAddressPostVm = billingAddress;
    }

    if (isValidate) {
      if (!paymentMethod) {
        toast.error('Please choose payment method!');
      } else {
        order.paymentMethod = paymentMethod;
      }

      order.checkoutId = id as string;
      order.email = checkout?.email!;
      order.note = data.note;
      order.tax = 0;
      order.discount = checkout?.totalDiscountAmount;
      order.numberItem = orderItems.reduce((result, item) => result + item.quantity, 0);
      order.totalPrice = orderItems.reduce(
        (result, item) => result + item.quantity * item.productPrice - (item.discountAmount ?? 0),
        0
      );
      order.deliveryFee = 0;
      order.couponCode = checkout?.couponCode;
      order.deliveryMethod = 'YAS_EXPRESS';
      order.paymentStatus = 'PENDING';
      order.orderItemPostVms = orderItems;
      setIsShowSpinner(true);
      setDisableProcessPayment(true);

      processPayment(id as string);
      handlePaymentProcess(order);
    }
  };

  const fetchOrderCheckout = async (id: string): Promise<Checkout | null> => {
    try {
      const res = await getCheckoutById(id);
      return res;
    } catch (err) {
      console.log('Fetch Order Checkout Failed: ', err);
      return null;
    }
  };

  const fetchOrderPayment = async (id: string): Promise<Payment | null> => {
    try {
      const res = await getPaymentById(id);
      return res;
    } catch (err) {
      console.log('Fetch Order Payment Failed: ', err);
      return null;
    }
  };

  const handlePaymentProcessForPaypal = () => {
    intervalId = setInterval(async () => {
      try {
        elapsedTimeRef.current += 2;

        const orderCheckout = await fetchOrderCheckout(id as string);

        if (isCreatedPayment(orderCheckout)) {
          const attributes = orderCheckout?.attributes
            ? JSON.parse(orderCheckout.attributes)
            : null;
          const orderPayment = await fetchOrderPayment(attributes?.payment_id);

          if (isPaymentProcessingAndExistedOrderId(orderPayment)) {
            redirectToPayment(orderPayment);
            clearInterval(intervalId);
          }
        } else if (elapsedTimeRef.current >= CREATE_PAYMENT_TIMEOUT) {
          handleErrorCreatingOrder();
        }
      } catch (err) {
        console.error('Handler check status Checkout and Payment Failed: ', err);
        handleErrorCreatingOrder();
      }
    }, 2000);
  };

  const isCreatedPayment = (orderCheckout: Checkout | null): boolean => {
    return (
      orderCheckout?.checkoutState === ECheckoutState.PAYMENT_PROCESSING &&
      orderCheckout?.progress === ECheckoutProgress.PAYMENT_CREATED
    );
  };

  const isPaymentProcessingAndExistedOrderId = (orderPayment: Payment | null): boolean => {
    return (
      orderPayment?.paymentStatus === EPaymentStatus.PROCESSING &&
      orderPayment.paymentProviderCheckoutId !== null
    );
  };

  const redirectToPayment = (orderPayment: Payment | null) => {
    const attributes = orderPayment?.attributes ? JSON.parse(orderPayment.attributes) : null;
    window.location.replace(attributes.redirect_url);
  };

  const handlePaymentProcess = (order: Order) => {
    const paymentMethod = order?.paymentMethod ?? '';
    switch (paymentMethod.toUpperCase()) {
      case 'COD':
        processCodPayment(order);
        break;
      case 'PAYPAL':
        handlePaymentProcessForPaypal();
        break;
      default:
        setIsShowSpinner(false);
        setDisableProcessPayment(false);
        toast.error('Place order failed');
    }
  };

  const handleErrorCreatingOrder = () => {
    setIsShowSpinner(false);
    clearInterval(intervalId);
    elapsedTimeRef.current = 0;
    setDisableProcessPayment(false);
    toast.error('Payment processing failed, please try again later.');
  };

  const processCodPayment = async (order: Order) => {
    setIsShowSpinner(false);
    setDisableProcessPayment(false);
    toast.error('COD payment feature is under construction');
  };

  return (
    <>
      <Container>
        <section className="checkout spad">
          <SpinnerComponent show={isShowSpinner}></SpinnerComponent>
          <div className="container">
            <div className="checkout__form">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSubmit((data) => onSubmitForm(data, event))(event);
                }}
              >
                <div className="row">
                  <div className="col-lg-8 col-md-6">
                    <h4>Shipping Address</h4>
                    <div className="checkout__input">
                      <button
                        type="button"
                        className="btn btn-outline-primary  fw-bold btn-sm me-2"
                        onClick={() => {
                          setAddShippingAddress(false);
                          setModalShipping(true);
                        }}
                      >
                        Change address <i className="bi bi-plus-circle-fill"></i>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-outline-primary  fw-bold btn-sm ${
                          addShippingAddress ? `active` : ``
                        }`}
                        onClick={() => setAddShippingAddress(true)}
                      >
                        Add new address <i className="bi bi-plus-circle-fill"></i>
                      </button>
                    </div>
                    <CheckOutAddress address={shippingAddress!} isDisplay={!addShippingAddress} />
                    <AddressForm
                      isDisplay={addShippingAddress}
                      register={registerShippingAddress}
                      setValue={setValueShippingAddress}
                      errors={errorsShippingAddress}
                      address={undefined}
                    />

                    <h4>Billing Address</h4>
                    <div className="row mb-4">
                      <div className="col-lg-6">
                        <div className="checkout__input__checkbox">
                          <label htmlFor="same_as_shipping">
                            Selected Billing Address same as Shipping Address
                            <input
                              type="checkbox"
                              id="same_as_shipping"
                              onChange={() => {
                                setSameAddress(!sameAddress);
                                setAddBillingAddress(false);
                                if (sameAddress && !addBillingAddress) setModalBilling(true);
                              }}
                              checked={sameAddress}
                            />
                            <span className="checkmark"></span>
                          </label>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <button
                          type="button"
                          className={`btn btn-outline-primary  fw-bold btn-sm ${
                            addBillingAddress ? `active` : ``
                          }`}
                          onClick={() => {
                            setAddBillingAddress(true);
                            setSameAddress(false);
                          }}
                        >
                          Add new address <i className="bi bi-plus-circle-fill"></i>
                        </button>
                      </div>
                    </div>

                    <CheckOutAddress
                      address={billingAddress!}
                      isDisplay={!sameAddress && !addBillingAddress}
                    />

                    <AddressForm
                      isDisplay={addBillingAddress}
                      setValue={setValueBillingAddress}
                      register={registerBillingAddress}
                      errors={errorsBillingAddress}
                      address={undefined}
                    />
                    <div className="checkout__input">
                      <Input
                        type="text"
                        labelText="Order Notes"
                        field="note"
                        register={register}
                        placeholder="Notes about your order, e.g. special notes for delivery."
                        error={errors.note?.message}
                      />
                    </div>
                    <div className="checkout__input">
                      <Input
                        type="text"
                        labelText="Email"
                        field="email"
                        register={register}
                        defaultValue={checkout?.email}
                        error={errors.note?.message}
                        disabled={true}
                      />
                    </div>
                  </div>
                  <div className="col-lg-4 col-md-6">
                    <CheckOutDetail
                      orderItems={orderItems}
                      disablePaymentProcess={disableProcessPayment}
                      setPaymentMethod={setPaymentMethod}
                    />
                  </div>
                </div>
              </form>
              <ModalAddressList
                showModal={showModalShipping}
                handleClose={handleCloseModalShipping}
                handleSelectAddress={handleSelectShippingAddress}
                defaultUserAddress={shippingAddress}
              />
              <ModalAddressList
                showModal={showModalBilling}
                handleClose={handleCloseModalBilling}
                handleSelectAddress={handleSelectBillingAddress}
                defaultUserAddress={shippingAddress}
              />
            </div>
          </div>
        </section>
      </Container>
    </>
  );
};

export default Checkout;
