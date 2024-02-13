'use client';

import { useEffect, useState } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import { Request } from '../entities/request.entity';
import { findAllRequests } from '../api/requests.service';

import RequestsTable from '../components/request-table';

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);

  const getData = async () => {
    const req = await findAllRequests();
    setRequests(req);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Typography variant="h2">Requests</Typography>
        </Grid>
        <Grid item xs={8}>
          <Grid container justifyContent="flex-end" spacing={1}>
            <Grid item>
              <Button
                variant="contained"
                onClick={() => {
                  getData();
                }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <RequestsTable requests={requests} />
    </>
  );
}
