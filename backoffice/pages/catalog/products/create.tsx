import { NextPage } from 'next';
import Link from 'next/link';
import { Tab, Tabs } from 'react-bootstrap';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { handleCreatingResponse } from '../../../modules/catalog/services/ResponseStatusHandlingService';
import { PRODUCT_URL } from '../../../constants/Common';
import {
  CrossSellProduct,
  ProductAttributes,
  ProductCategoryMapping,
  ProductGeneralInformation,
  ProductImage,
  ProductSEO,
  ProductVariation,
  RelatedProduct,
} from '../../../modules/catalog/components';
import { FormProduct } from '../../../modules/catalog/models/FormProduct';
import { ProductAttributeValuePost } from '../../../modules/catalog/models/ProductAttributeValuePost';
import { mapFormProductToProductPayload } from '../../../modules/catalog/models/ProductPayload';
import { createProductAttributeValueOfProduct } from '../../../modules/catalog/services/ProductAttributeValueService';
import { createProduct } from '../../../modules/catalog/services/ProductService';
import { useRouter } from 'next/router';

const ProductCreate: NextPage = () => {
  const router = useRouter();
  const {
    register,
    setValue,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormProduct>({
    defaultValues: {
      isVisibleIndividually: true,
      isPublished: true,
      isAllowedToOrder: true,
    },
  });

<<<<<<< Updated upstream
  const onSubmitForm: SubmitHandler<FormProduct> = async (data) => {
    try {
      // create product
      const payload = mapFormProductToProductPayload(data);
      const productResponse = await createProduct(payload);
=======
  const onSubmitForm: SubmitHandler<ProductPost> = async (data) => {
    data.brandId = data.brandId == 0 ? undefined : data.brandId;
    const product = {
      name: data.name,
      slug: data.slug,
      brandId: data.brandId,
      categoryIds: data.categoryIds,
      shortDescription: data.shortDescription,
      description: data.description,
      specification: data.specification,
      sku: data.sku,
      gtin: data.gtin,
      price: data.price,
      isAllowedToOrder: data.isAllowedToOrder,
      isPublished: data.isPublished,
      isFeatured: data.isFeatured,
      isVisibleIndividually: data.isVisibleIndividually,
      metaTitle: data.metaTitle,
      metaKeyword: data.metaKeyword,
      metaDescription: data.metaDescription,
      remainingQuantity: data.remainingQuantity,
    };
    let response = await createProduct(product, data.thumbnail, data.productImages);
    let res = await response.json();
    // upload variation
    let variations = data.productVariations || [];
    for (const option of variations) {
      let _product = {
        name: option.optionName,
        slug: slugify(option.optionName),
        sku: option.optionSku,
        gtin: option.optionGTin,
        price: option.optionPrice,
        parentId: res.id,
      };
      await createProduct(_product, option.optionThumbnail, option.optionImages);
    }
>>>>>>> Stashed changes

      // upload product attribute
      for (const att of data.productAttributes || []) {
        let productAtt: ProductAttributeValuePost = {
          ProductId: productResponse.id,
          productAttributeId: att.id,
          value: att.value,
        };
        await createProductAttributeValueOfProduct(productAtt);
      }

      toast.success('Create product successfully');
      await router.push(PRODUCT_URL);
    } catch (error) {
      toast.error('Create product failed');
    }
  };

  return (
    <div className="create-product">
      <h2>Create Product</h2>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <Tabs defaultActiveKey={'general'} className="mb-3">
          <Tab eventKey={'general'} title="General Information">
            <ProductGeneralInformation register={register} errors={errors} setValue={setValue} />
          </Tab>
          <Tab eventKey={'image'} title="Product Images">
            <ProductImage setValue={setValue} />
          </Tab>
          <Tab eventKey={'variation'} title="Product Variations">
            <ProductVariation getValue={getValues} setValue={setValue} />
          </Tab>

          <Tab eventKey={'attribute'} title="Product Attributes">
            <ProductAttributes setValue={setValue} getValue={getValues} />
          </Tab>
          <Tab eventKey={'category'} title="Category Mapping">
            <ProductCategoryMapping setValue={setValue} getValue={getValues} />
          </Tab>
          <Tab eventKey={'related'} title="Related Products">
            <RelatedProduct setValue={setValue} getValue={getValues} />
          </Tab>
          <Tab eventKey={'cross-sell'} title="Cross-sell Product">
            <CrossSellProduct setValue={setValue} getValue={getValues} />
          </Tab>
          <Tab eventKey={'seo'} title="SEO">
            <ProductSEO register={register} errors={errors} />
          </Tab>
        </Tabs>
        <div className="text-center">
          <button className="btn btn-primary" type="submit">
            Create
          </button>
          <Link href="/catalog/products">
            <button className="btn btn-secondary m-3">Cancel</button>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ProductCreate;
