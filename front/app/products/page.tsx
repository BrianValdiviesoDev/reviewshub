'use client';

import { useEffect, useState } from 'react';
import { Product } from '../entities/product.entity';
import { getAllProducts } from '../api/products.service';
import {
  Alert,
  Button,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowsProp,
  GridToolbar,
} from '@mui/x-data-grid';
import LaunchIcon from '@mui/icons-material/Launch';
import { Review, ReviewType } from '../entities/review.entity';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<GridRowsProp>([]);

  const router = useRouter();

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
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
                <Tooltip title="Visit website">
                  <IconButton
                    onClick={() => {
                      window.open(params.row.originUrl, '_blank');
                    }}
                  >
                    <LaunchIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </>
        );
      },
    },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'price', headerName: 'Price', flex: 1 },
    { field: 'marketplace', headerName: 'Market place', flex: 1 },
    { field: 'reviews', headerName: 'Reviews', flex: 1 },
    {
      field: 'scrappedReviews',
      headerName: 'Scrapped reviews',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.scrappedReviews) {
          const scrapped = params.row.scrappedReviews.filter(
            (r: Review) => r.type === ReviewType.SCRAPPED,
          );
          return scrapped?.length || '--';
        }
        return '--';
      },
    },
    {
      field: 'generatedReviews',
      headerName: 'Generated reviews',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        if (params.row.scrappedReviews) {
          const gen = params.row.scrappedReviews.filter(
            (r: Review) => r.type === ReviewType.GENERATED,
          );
          return gen?.length || '--';
        }
        return '--';
      },
    },
    { field: 'rating', headerName: 'Rating', flex: 1 },
    {
      field: 'matches',
      headerName: 'Matches',
      flex: 1,
      renderCell: (params: GridRenderCellParams) =>
        params.row.matches?.length || 0,
    },
    { field: 'updatedAt', headerName: 'Last update', flex: 1 },
  ];

  useEffect(() => {
    const getData = async () => {
      const products = await getAllProducts();
      setProducts(products);
      const newRows = products.map((item, i) => {
        return {
          ...item,
          id: i,
        };
      });
      setRows(newRows || []);
    };
    getData();
  }, []);
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography variant="h2">Products</Typography>
        </Grid>
        <Grid item xs={4}>
          <Grid container justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={() => {
                router.push('/products/edit/new');
              }}
            >
              Add product
            </Button>
          </Grid>
        </Grid>
      </Grid>
      {products.length > 0 ? (
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 50,
              },
            },
          }}
          pageSizeOptions={[5]}
          slots={{ toolbar: GridToolbar }}
          disableRowSelectionOnClick
        />
      ) : (
        <Alert severity="info">No products found</Alert>
      )}
    </>
  );
}
