'use client';
import { useEffect, useRef, useState } from 'react';
import {
  NewProductWithReviews,
  PostProduct,
  ProductType,
} from '../../../entities/product.entity';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  TextareaAutosize as BaseTextareaAutosize,
  FormControl,
  styled,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Field,
  FieldArray,
  Form,
  Formik,
  FormikHelpers,
  FormikProps,
} from 'formik';
import * as yup from 'yup';
import {
  createProduct,
  createProductAndGenerateReviews,
  getProduct,
  updateProduct,
} from '../../../api/products.service';
import { AxiosError } from 'axios';
import { ApiHandlerError } from '../../../api/api.handler';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { Prompt, PromptTypes } from '../../../entities/prompt.entity';
import { getAllPrompts } from '../../../api/prompts.service';

export default function ProductForm({ params }: { params: { id: string } }) {
  const [productId, setProductId] = useState<string>(params.id);
  const [formData, setFormData] = useState<NewProductWithReviews>({
    product: {
      type: ProductType.MANUAL,
      name: '',
      originUrl: '',
    },
    numberOfReviews: 0,
    webhookUrl: '',
  });
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const formikRef = useRef<FormikHelpers<NewProductWithReviews> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      if (productId !== 'new') {
        try {
          const product = await getProduct(productId);
          const data = {
            ...formData,
            product,
          };
          setFormData(data);
          if (formikRef.current) {
            formikRef.current.setValues(data);
          }
        } catch (e: any) {
          ApiHandlerError(e as AxiosError);
        }
      }
      try {
        const prompts = await getAllPrompts();
        setPrompts(prompts);
      } catch (e: any) {
        ApiHandlerError(e as AxiosError);
      }
    };
    getData();
  }, [productId]);

  const validationSchema = yup.object().shape({
    product: yup.object({
      name: yup.string().required('Name is required'),
      originUrl: yup.string().required('Origin URL is required'),
      factsPrompt: yup.string().required('Facts prompt is required'),
      reviewsPrompt: yup.string().required('Reviews prompt is required'),
      checkMatchesPrompt: yup
        .string()
        .required('Check matches prompt is required'),
    }),
  });

  const handleSubmit = async (values: NewProductWithReviews) => {
    try {
      if (productId && productId !== 'new') {
        await updateProduct(productId, values.product);
        toast.success('Product updated');
        router.push('/products');
      } else {
        await createProductAndGenerateReviews(values);
        toast.success('Product created and genearting reviews');
        router.push('/products');
      }
    } catch (e: any) {
      ApiHandlerError(e as AxiosError);
    }
  };

  const Textarea = styled(BaseTextareaAutosize)(
    ({ theme }) => `
    width: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    padding: 12px;
    border-radius: 5px;
    background-color: transparent;


    // firefox
    &:focus-visible {
      outline: 0;
    }
  `,
  );

  return (
    <>
      <Container maxWidth="sm">
        <Typography variant="h5" align="center" gutterBottom>
          Create product
        </Typography>
        <Formik
          innerRef={formikRef as React.Ref<FormikProps<NewProductWithReviews>>}
          initialValues={formData}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            handleChange,
            handleBlur,
            touched,
            errors,
            setValues,
          }) => (
            <Form>
              <TextField
                label="Name"
                fullWidth
                name="product.name"
                value={values.product.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.product?.name && Boolean(errors.product?.name)}
                helperText={touched.product?.name && errors.product?.name}
                margin="normal"
              />
              <TextField
                label="URL"
                fullWidth
                name="product.originUrl"
                value={values.product?.originUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                error={
                  touched.product?.originUrl &&
                  Boolean(errors.product?.originUrl)
                }
                helperText={
                  touched.product?.originUrl && errors.product?.originUrl
                }
                margin="normal"
              />

              <Box>
                <Typography>Properties</Typography>
              </Box>
              <Field
                name="product.properties"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.product?.properties}
                as={Textarea}
                placeholder="Your product properties"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="checkMatchesPrompt-label">
                  Check matches prompt
                </InputLabel>
                <Select
                  labelId="checkMatchesPrompt-label"
                  name="product.checkMatchesPrompt"
                  value={values.product?.checkMatchesPrompt}
                  label="Facts prompt"
                  onChange={handleChange}
                  error={
                    touched.product?.checkMatchesPrompt &&
                    Boolean(errors.product?.checkMatchesPrompt)
                  }
                >
                  {prompts
                    .filter((p) => p.type === PromptTypes.CHECK_MATCHES)
                    .map((prompt, i) => (
                      <MenuItem value={prompt._id} key={i}>
                        {prompt.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="factsPrompt-label">Facts prompt</InputLabel>
                <Select
                  labelId="factsPrompt-label"
                  name="product.factsPrompt"
                  value={values.product?.factsPrompt}
                  label="Facts prompt"
                  onChange={handleChange}
                  error={
                    touched.product?.factsPrompt &&
                    Boolean(errors.product?.factsPrompt)
                  }
                >
                  {prompts
                    .filter((p) => p.type === PromptTypes.GENERATE_FACTS)
                    .map((prompt, i) => (
                      <MenuItem value={prompt._id} key={i}>
                        {prompt.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel id="reviewsPrompt-label">Reviews prompt</InputLabel>
                <Select
                  labelId="reviewsPrompt-label"
                  name="product.reviewsPrompt"
                  value={values.product?.reviewsPrompt}
                  label="Reviews prompt"
                  onChange={handleChange}
                  error={
                    touched.product?.reviewsPrompt &&
                    Boolean(errors.product?.reviewsPrompt)
                  }
                >
                  {prompts
                    .filter((p) => p.type === PromptTypes.GENERATE_REVIEWS)
                    .map((prompt, i) => (
                      <MenuItem value={prompt._id} key={i}>
                        {prompt.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              {productId === 'new' && (
                <>
                  <TextField
                    label="Number of reviews"
                    placeholder="How many reviews do you want?"
                    fullWidth
                    name="numberOfReviews"
                    value={values.numberOfReviews}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    margin="normal"
                    type="number"
                  />
                  <TextField
                    label="Webhook URL"
                    placeholder="Webhook URL"
                    fullWidth
                    name="webhookUrl"
                    value={values.webhookUrl}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    margin="normal"
                  />
                </>
              )}
              <Button type="submit" variant="contained" color="primary">
                Enviar
              </Button>
            </Form>
          )}
        </Formik>
      </Container>
    </>
  );
}
