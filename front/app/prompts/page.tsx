'use client';

import { useEffect, useState } from 'react';
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
import { Prompt } from '../entities/prompt.entity';
import { getAllPrompts } from '../api/prompts.service';

export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
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
                <Tooltip title="Edit prompt">
                  <IconButton
                    onClick={() => {
                      router.push(`/prompts/${params.row._id}`);
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </>
        );
      },
    },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'updatedAt', headerName: 'Last update', flex: 1 },
  ];

  useEffect(() => {
    const getData = async () => {
      const prompts = await getAllPrompts();
      setPrompts(prompts);
      const newRows = prompts.map((item, i) => {
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
          <Typography variant="h2">Prompts</Typography>
        </Grid>
        <Grid item xs={4}>
          <Grid container justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={() => {
                router.push('/prompts/new');
              }}
            >
              Add prompt
            </Button>
          </Grid>
        </Grid>
      </Grid>
      {prompts.length > 0 ? (
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
        <Alert severity="info">No prompts found</Alert>
      )}
    </>
  );
}
