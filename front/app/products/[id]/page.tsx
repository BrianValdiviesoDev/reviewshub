'use client';
import {
  Alert,
  Button,
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Tooltip,
  List,
  ListItemText,
  ListItem,
  TextField,
  Divider,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  Matches,
  Pipeline,
  Product,
  ProductType,
} from '../../entities/product.entity';
import {
  checkProductMatches,
  findProductInMarketplaces,
  generateReviews,
  getProduct,
  getProductFacts,
  verifyProduct,
} from '../../api/products.service';
import { ApiHandlerError } from '../../api/api.handler';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Link from 'next/link';
import { toast } from 'react-toastify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Review, ReviewType } from '../../entities/review.entity';
import { findReviewsByProduct } from '../../api/reviews.service';
import {
  DataGrid,
  GridCheckCircleIcon,
  GridColDef,
  GridRenderCellParams,
  GridRowsProp,
  GridToolbar,
} from '@mui/x-data-grid';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import {
  findRequestsByProduct,
  scrapeProductInfo,
  scrapeReviews,
} from '../../api/requests.service';
import { Request, RequestStatus } from '../../entities/request.entity';
import RequestsTable from '../../components/request-table';
import { useAuthStore } from '../../stores/auth.store';
import { UserRole } from '../../entities/user.entity';
import ScrapperProgressbar from '../../components/scrapper-progressbar';
import useSocketListener from '../../sockets/listener';
import { EventTypes } from '../../entities/event.entity';
import EditIcon from '@mui/icons-material/Edit';
import ReviewCard from '../../components/review-card';
import DownloadIcon from '@mui/icons-material/Download';

export default function Product({ params }: { params: { id: string } }) {
  const { user } = useAuthStore();
  const [productId, setProductId] = useState<string>(params.id);
  const [product, setProduct] = useState<Product>();
  const [matchesLoading, setMatchesLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<string | false>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [reviewsToBuy, setReviewsToBuy] = useState<number>(10);
  const [pipeline, setPipeline] = useState<Pipeline>({
    findInMarketplaces: false,
    readProducts: false,
    matching: false,
    readReviews: false,
    buildFacts: false,
    done: false,
  });
  const router = useRouter();

  const sockets = useSocketListener((event: EventTypes, data: any) => {
    console.log('PRODCUT');
    console.log(event, data);
    switch (event) {
      case EventTypes.product_updated:
        if (data.productId === productId) {
          getProductInfo();
        }
        break;
      case EventTypes.product_facts_generated:
        if (data.productId === productId) {
          getReviews();
        }
        break;
      case EventTypes.request_updated:
        updateRequest(data.requestId, data.status, data.error);
        break;
      case EventTypes.new_request:
        getRequests();
        break;
      case EventTypes.new_reviews_generated:
        getReviews();
        break;
      default:
        break;
    }
  });

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const updateRequest = (
    requestId: string,
    status: RequestStatus,
    error?: string,
  ) => {
    const find = requests.find((r) => r._id === requestId);
    console.log('FIND: ', find);
    if (!find) {
      getRequests();
      return;
    }
    const newRequests = requests.map((r) => {
      if (r._id === requestId) {
        r.status = status;
        r.error = error;
      }
      return r;
    });
    console.log('NEW REQUESTS: ', newRequests);
    setRequests(newRequests);
  };

  const findInMarkets = async () => {
    try {
      await findProductInMarketplaces(productId);
      toast.success('Searching product in marketplaces...');
    } catch (e: any) {
      ApiHandlerError(e as AxiosError);
    }
  };
  const verify = async (id: string, matchId: string) => {
    try {
      const verified = await verifyProduct(id, matchId);
      setProduct(verified);
      toast.success('Product verified');
    } catch (e: any) {
      ApiHandlerError(e as AxiosError);
    }
  };

  const probabilityAvg = (percentages: number[]) => {
    if (!percentages) return '--';
    let sum = 0;
    percentages.forEach((percentage: any) => {
      let number = 0;
      try {
        number = parseInt(percentage);
      } catch (e) {
        console.error(e);
        number = 0;
      }
      sum += number;
    });
    const avg = sum / percentages.length;
    return avg.toFixed(0);
  };

  const checkMatches = async (matchId?: string) => {
    setMatchesLoading(true);
    try {
      if (!product || !product.matches) return;
      if (matchId) {
        await checkProductMatches(productId, [matchId]);
      } else {
        await checkProductMatches(
          productId,
          product.matches.map((m) => m.product._id),
        );
      }
      toast.success('Checking matches...');
    } catch (e: any) {
      ApiHandlerError(e as AxiosError);
    }
    setMatchesLoading(false);
  };

  const getProductInfo = async () => {
    if (productId !== 'new') {
      try {
        const product = await getProduct(productId);
        setProduct(product);
        if (product.matches) {
          generateRows(product.matches);
        }
      } catch (e: any) {
        ApiHandlerError(e as AxiosError);
      }
    }
  };

  const getReviews = async () => {
    try {
      const reviews = await findReviewsByProduct(productId);
      setReviews(reviews);
    } catch (e: any) {
      ApiHandlerError(e as AxiosError);
    }
  };

  const getRequests = async () => {
    try {
      const requests = await findRequestsByProduct(productId);
      setRequests(requests);
    } catch (e: any) {
      ApiHandlerError(e as AxiosError);
    }
  };

  const generateRows = (matches: Matches[]) => {
    if (!matches) return;
    const newRows = matches.map((item, i) => {
      return {
        ...item.product,
        percentage: item.percentage,
        id: i,
      };
    });
    setRows(newRows || []);
  };

  const buyReviews = async () => {
    try {
      await generateReviews(productId, reviewsToBuy);
      toast.success('Generating reviews...');
    } catch (e: any) {
      ApiHandlerError(e as AxiosError);
    }
  };

  const downloadReviewsCSV = () => { 
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'title;description;rating;username;userAvatar\n'+
        reviews.map((review:Review) => {
          return [review.title, review.description, review.rating, review.username, review.userAvatar].join(';')
        }).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'reviewsHub.csv');
      document.body.appendChild(link);
      link.click();
    };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    {
      field: 'percentage',
      headerName: 'Percentage',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        return (
          <>
            <Grid>
              <Typography>{probabilityAvg(params.value)}%</Typography>
              {params.value.length && (
                <Typography sx={{ fontSize: 'smaller' }}>
                  {params.value.join(', ')}
                </Typography>
              )}
            </Grid>
          </>
        );
      },
    },
    { field: 'price', headerName: 'Price', width: 200 },
    { field: 'rating', headerName: 'Rating', width: 200 },
    { field: 'reviews', headerName: 'Reviews', width: 200 },
    { field: 'updatedAt', headerName: 'Last update', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        return (
          <>
            <Grid container spacing={1}>
              <Grid item>
                <Tooltip title="View product">
                  <IconButton
                    onClick={() => {
                      router.push(`/products/${params.row._id}`);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Compare with product">
                  <IconButton onClick={() => checkMatches(params.row._id)}>
                    <CompareArrowsIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              {params.row.percentage.length &&
                !params.row.percentage.find(
                  (p: any) => parseInt(p) === 100,
                ) && (
                  <Grid item>
                    <Tooltip title="Verify match">
                      <IconButton
                        onClick={() => {
                          verify(productId, params.row._id);
                        }}
                      >
                        <GridCheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
            </Grid>
          </>
        );
      },
    },
  ];

  useEffect(() => {
    if (productId) {
      getProductInfo();
      getReviews();
      getRequests();
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      setPipeline(product.pipeline);
    }
  }, [product]);

  return (
    <>
      {product ? (
        <>
          <Grid container spacing={2}>
            {product.type === ProductType.MANUAL && requests.length > 0 &&(
              <Grid item xs={12}>
                <ScrapperProgressbar
                  productPipeline={product.pipeline}
                  productId={productId}
                  totalRequests={requests.length}
                  pendingRequests={requests.filter(r=>r.status === RequestStatus.PENDING).length}
                />
              </Grid>
            )}
            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {product.name}{' '}
                    <Link
                      href={product.originUrl}
                      target="_blank"
                      color="#FF6000"
                    >
                      <VisibilityIcon sx={{ color: '#FF6000' }} />
                    </Link>
                    {product.type === ProductType.MANUAL && (
                      <Link href={`/products/edit/${productId}`}>
                        <EditIcon sx={{ color: '#FF6000' }} />
                      </Link>
                    )}
                  </Typography>
                  <Divider />
                </CardContent>
                <CardContent sx={{ overflowY: 'auto', maxHeight: '50vh' }}>
                  <Typography mt={2} sx={{ fontWeight: 'bold' }}>
                    Properties
                  </Typography>
                  <Typography mb={2}>{product?.properties}</Typography>
                  <Typography>
                    <b>Marketplace</b>: {product?.marketplace || '--'}
                  </Typography>
                  <Typography>
                    <b>Price</b>: {product?.price || '--'}
                  </Typography>
                  <Typography>
                    <b>Rating</b>: {product?.rating || '--'}
                  </Typography>
                  <Typography>
                    <b>Reviews</b>: {product?.reviews || '--'}
                  </Typography>
                  <Typography>
                    <b>Updated at</b>:{' '}
                    {product?.updatedAt
                      ? moment(product.updatedAt).format('YYYY-MM-DD HH:mm')
                      : '--'}
                  </Typography>
                  {user?.rol === UserRole.SUPERADMIN &&
                    product.type === ProductType.SCRAPPED && (
                      <Button
                        variant="contained"
                        onClick={() => scrapeProductInfo(product)}
                        disabled={
                          requests.find(
                            (r) => r.status === RequestStatus.PENDING,
                          )
                            ? true
                            : false
                        }
                        sx={{ marginTop: 2 }}
                      >
                        Scrape info
                      </Button>
                    )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {' '}
                    Reviews ({reviews.length})
                  </Typography>
                  <Divider />
                </CardContent>
                <CardContent sx={{ overflowY: 'auto', maxHeight: '50vh' }}>
                  {product.type === ProductType.MANUAL &&
                    product.facts &&
                    product.facts.length > 0 && (
                      <Grid container spacing={2} mt={2} mb={2}>
                        <Grid item>
                          <TextField
                            id="outlined-number"
                            label="Quantity"
                            type="number"
                            value={reviewsToBuy}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            onChange={(e) =>
                              setReviewsToBuy(parseInt(e.target.value))
                            }
                          />
                        </Grid>
                        <Grid item>
                          <Button
                            variant='contained'
                            onClick={() => buyReviews()}
                            disabled={product.facts ? false : true}
                          >
                            Buy reviews
                          </Button>
                        </Grid>
                      </Grid>
                    )}
                  <Typography>
                    Scrapped reviews:{' '}
                    {
                      reviews.filter((r) => r.type === ReviewType.SCRAPPED)
                        .length
                    }
                    {'  '}Generated reviews:{' '}
                    {
                      reviews.filter((r) => r.type === ReviewType.GENERATED)
                        .length
                    }
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => downloadReviewsCSV()}
                    sx={{ marginBottom: 2 }}
                  >
                    <DownloadIcon />
                    Download reviews
                  </Button>

                  {reviews?.map((review, i) => (
                    <ReviewCard review={review} key={i} />
                  ))}

                  {user?.rol === UserRole.SUPERADMIN &&
                    product.type === ProductType.SCRAPPED && (
                      <Button
                        variant="contained"
                        onClick={() => scrapeReviews(product)}
                        disabled={
                          requests.find(
                            (r) => r.status === RequestStatus.PENDING,
                          )
                            ? true
                            : false
                        }
                      >
                        Scrape Reviews
                      </Button>
                    )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography sx={{ fontWeight: 'bold' }}> Matches</Typography>
                  <Divider />
                </CardContent>
                <CardContent sx={{ overflowY: 'auto', maxHeight: '50vh' }}>
                  <DataGrid
                    sx={{ mt: 2 }}
                    rows={rows}
                    columns={columns}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 10,
                        },
                      },
                    }}
                    pageSizeOptions={[5]}
                    slots={{ toolbar: GridToolbar }}
                    disableRowSelectionOnClick
                  />
                  {user?.rol === UserRole.SUPERADMIN && (
                    <Grid container spacing={2} mt={2}>
                      {!requests.find(
                        (r) => r.status === RequestStatus.PENDING,
                      ) &&
                        product.type === ProductType.MANUAL && (
                          <Grid item>
                            <Button
                              variant="contained"
                              onClick={() => {
                                findInMarkets();
                              }}
                            >
                              Find in Marketplaces
                            </Button>
                          </Grid>
                        )}

                      {product.matches && product.matches.length > 0 && (
                        <Grid item>
                          <Button
                            variant="contained"
                            onClick={() => checkMatches()}
                          >
                            Check all matches
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                variant="outlined"
                sx={{ overflowY: 'auto', maxHeight: '70vh' }}
              >
                <CardContent>
                  <Typography sx={{ fontWeight: 'bold' }}>Facts</Typography>
                  <Divider />
                </CardContent>
                <CardContent sx={{ overflowY: 'auto', maxHeight: '50vh' }}>
                  <List>
                    {product?.facts?.map((fact, i) => (
                      <ListItem key={i}>
                        <ListItemText>{fact}</ListItemText>
                      </ListItem>
                    ))}
                  </List>
                  {user?.rol === UserRole.SUPERADMIN && reviews.length > 0 && (
                    <Button
                      variant="contained"
                      onClick={() => getProductFacts(productId)}
                    >
                      Get Facts
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                variant="outlined"
                sx={{ overflowY: 'auto', maxHeight: '70vh' }}
              >
                <CardContent>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    Requests ({requests.length})
                  </Typography>
                  <Divider />
                </CardContent>
                <CardContent sx={{ overflowY: 'auto', maxHeight: '50vh' }}>
                  <RequestsTable requests={requests} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          <Alert severity="error">Product not found</Alert>
        </>
      )}
    </>
  );
}
