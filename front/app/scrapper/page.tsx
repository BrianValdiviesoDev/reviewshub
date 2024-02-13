'use client';
import { useEffect, useState } from 'react';
import { checkHealth, startScrapper, stopScrapper } from '../api/scrapper';
import { Button, Grid, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import LogTimeline from '../components/log-timeline';

export default function Scrapper() {
  const [scrapperHealth, setScrapperHealth] = useState<boolean>(false);

  const stop = async () => {
    try {
      const req = await stopScrapper();
      toast.success('Scrapper stopped');
    } catch (e: any) {
      toast.error(`Error stopping scrapper: ${e.message}`);
    }
  };

  const start = async () => {
    try {
      const req = await startScrapper();
      toast.success('Scrapper started');
    } catch (e: any) {
      toast.error(`Error starting scrapper: ${e.message}`);
    }
  };

  const check = async () => {
    try {
      const status = await checkHealth();
      if (status.toLowerCase() === 'ok') {
        toast.success('Scrapper connected');
        setScrapperHealth(true);
      } else {
        toast.error(`Error connecting scrapper: ${status}`);
        setScrapperHealth(false);
      }
    } catch (e: any) {
      toast.error(`Error connecting scrapper: ${e.message}`);
      setScrapperHealth(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={4}>
          <Typography variant="h2">Scrapping</Typography>
        </Grid>
        <Grid item xs={8}>
          <Grid container justifyContent="flex-end" spacing={1}>
            {scrapperHealth ? (
              <>
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={() => {
                      start();
                    }}
                  >
                    Start scrapper
                  </Button>
                </Grid>

                <Grid item>
                  <Button
                    variant="contained"
                    onClick={() => {
                      stop();
                    }}
                  >
                    Stop scrapper
                  </Button>
                </Grid>
              </>
            ) : (
              <Grid item>
                <Button
                  variant="contained"
                  onClick={() => {
                    check();
                  }}
                >
                  Check scrapper
                </Button>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
      <LogTimeline />
    </>
  );
}
