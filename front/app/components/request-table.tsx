'use client';

import { useEffect, useState } from 'react';
import { Grid, IconButton, Link, Tooltip, Typography } from '@mui/material';
import { Request, RequestStatus } from '../entities/request.entity';
import {
  cancelRequest,
  duplicateRequest,
  removeRequest,
} from '../api/requests.service';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridRowsProp,
  GridToolbar,
} from '@mui/x-data-grid';
import LaunchIcon from '@mui/icons-material/Launch';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoIcon from '@mui/icons-material/Info';

interface Props {
  requests: Request[];
}

export default function RequestsTable({ requests }: Props) {
  const [rows, setRows] = useState<GridRowsProp>([]);

  const getData = async () => {
    const rows = requests.map((item, i) => {
      return {
        ...item,
        id: i,
      };
    });
    setRows(rows || []);
  };

  const remove = async (id: string) => {
    const req = await removeRequest(id);
    getData();
  };

  const cancel = async (id: string) => {
    const req = await cancelRequest(id);
    getData();
  };

  const duplicate = async (request: Request) => {
    const req = await duplicateRequest(request);
    getData();
  };

  const columns: GridColDef[] = [
    { field: 'type', headerName: 'Type', width: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <>
          <Typography>{params.row.status}</Typography>
          {params.row.error && (
            <Tooltip title={params.row.error}>
              <InfoIcon />
            </Tooltip>
          )}
        </>
      ),
    },
    {
      field: 'productId',
      headerName: 'Product',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Link href={`products/${params.row.productId}`} target="_blank">
          {params.value}
        </Link>
      ),
    },
    { field: 'executionDate', headerName: 'Executed at', width: 200 },
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
                <Tooltip title="Duplicate request">
                  <IconButton onClick={() => duplicate(params.row)}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip title="Visit url">
                  <IconButton
                    onClick={() => {
                      window.open(params.row.url, '_blank');
                    }}
                  >
                    <LaunchIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item>
                {params.row.status === RequestStatus.PENDING ||
                params.row.status === RequestStatus.IN_PROGRESS ? (
                  <Tooltip title="Cancel request">
                    <IconButton
                      onClick={() => {
                        cancel(params.row._id);
                      }}
                    >
                      <RemoveCircleIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Remove request">
                    <IconButton
                      onClick={() => {
                        remove(params.row._id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Grid>
            </Grid>
          </>
        );
      },
    },
  ];

  useEffect(() => {
    getData();
  }, [requests]);

  return (
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
  );
}
