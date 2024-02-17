'use client';
import { useEffect, useRef, useState } from 'react';
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
  Grid,
  List,
  ListItem,
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
import { AxiosError } from 'axios';
import { ApiHandlerError } from '../../api/api.handler';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import {
  PostPrompt,
  PromptModels,
  PromptTypes,
} from '../../entities/prompt.entity';
import {
  createPrompt,
  getPrompt,
  updatePrompt,
} from '../../api/prompts.service';
import { Product } from '../../entities/product.entity';

export default function ProductForm({ params }: { params: { id: string } }) {
  const [promptId, setPromptId] = useState<string>(params.id);
  const [formData, setFormData] = useState<PostPrompt>({
    name: '',
    prompt: '',
    type: PromptTypes.GENERATE_FACTS,
    model: PromptModels.GPT_3_5_TURBO,
  });
  const formikRef = useRef<FormikHelpers<PostPrompt> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getData = async () => {
      if (promptId !== 'new') {
        try {
          const prompt = await getPrompt(promptId);
          setFormData(prompt);
          formikRef.current?.setValues(prompt);
        } catch (e: any) {
          ApiHandlerError(e as AxiosError);
        }
      }
    };
    getData();
  }, [promptId]);

  const validationSchema = yup.object({
    name: yup.string().required('Name is required'),
    prompt: yup.string().required('Prompt is required'),
    type: yup.string().required('Type is required'),
    model: yup.string().required('Model is required'),
  });

  const handleSubmit = async (values: PostPrompt) => {
    try {
      if (promptId && promptId !== 'new') {
        await updatePrompt(promptId, values);
        toast.success('Prompt updated');
        router.push('/prompts');
      } else {
        await createPrompt(values);
        toast.success('Prompt created');
        router.push('/prompts');
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
      <Container maxWidth="lg">
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <Typography variant="h5" align="center" gutterBottom>
              Create prompt
            </Typography>
            <Formik
              innerRef={formikRef as React.Ref<FormikProps<PostPrompt>>}
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
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    margin="normal"
                  />
                  <FormControl fullWidth>
                    <InputLabel id="type-label">Type</InputLabel>
                    <Select
                      labelId="type-label"
                      name="type"
                      value={values.type}
                      label="Type"
                      onChange={handleChange}
                      error={touched.type && Boolean(errors.type)}
                    >
                      {Object.keys(PromptTypes).map((type, i) => (
                        <MenuItem value={type} key={i}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel id="model-label">Model</InputLabel>
                    <Select
                      labelId="model-label"
                      name="model"
                      value={values.model}
                      label="Model"
                      onChange={handleChange}
                      error={touched.model && Boolean(errors.model)}
                    >
                      {Object.values(PromptModels).map((type, i) => (
                        <MenuItem value={type} key={i}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box>
                    <Typography>Pre-Prompt</Typography>
                  </Box>
                  <Field
                    name="preprompt"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.preprompt}
                    as={Textarea}
                    placeholder="Your pre-prompt to OpenAI"
                  />

                  <Box>
                    <Typography>Prompt</Typography>
                  </Box>
                  <Field
                    name="prompt"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.prompt}
                    as={Textarea}
                    placeholder="Your prompt to OpenAI"
                  />
                  <Button type="submit" variant="contained" color="primary">
                    Enviar
                  </Button>
                </Form>
              )}
            </Formik>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="h5" align="center" gutterBottom>
              Prompt syntax
            </Typography>
            <Box sx={{ border: '1px solid black', borderRadius: '5px' }} p={2}>
              <Typography>Product fields</Typography>
              <List>
                <ListItem>Name: ##product.name##</ListItem>
                <ListItem>Properties: ##product.properties##</ListItem>
                <ListItem>Metadata: ##product.metadata##</ListItem>
                <ListItem>Price: ##product.price##</ListItem>
                <ListItem>Pending reviews: ##product.pendingReviews##</ListItem>
                <ListItem>Facts: ##product.facts##</ListItem>
                <ListItem>Reviews: ##product.reviews##</ListItem>
              </List>
              <Typography mt={4}>Product match fields</Typography>
              <List>
                <ListItem>Name: ##match.name##</ListItem>
                <ListItem>Properties: ##match.properties##</ListItem>
                <ListItem>Metadata: ##match.metadata##</ListItem>
                <ListItem>Price: ##match.price##</ListItem>
              </List>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
