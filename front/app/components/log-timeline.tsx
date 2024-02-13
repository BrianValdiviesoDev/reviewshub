'use client';
import { useEffect, useState } from 'react';
import { getLogByDate } from '../api/scrapper';
import moment from 'moment';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Pagination,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Request, RequestStatus } from '../entities/request.entity';
import { findAllRequests } from '../api/requests.service';
import Switch from '@mui/material/Switch';
import SimpleLog from '../components/simple-log';
import GroupedLogs from '../components/grouped-log';
import { LogResponseDto } from '../entities/log.entity';

interface LogProps {
  fromDate?: string;
  toDate?: string;
  showWarnings?: boolean;
  showErrors?: boolean;
  showResults?: boolean;
  showInfos?: boolean;
  showScrapperLogs?: boolean;
  showAILogs?: boolean;
  showQueueLogs?: boolean;
  showApiLogs?: boolean;
  requestId?: string;
  productId?: string;
}

export default function LogTimeline(props: LogProps) {
  const [fromDate, setFromDate] = useState<string>(
    props.fromDate || moment().format('YYYY-MM-DD'),
  );
  const [toDate, setToDate] = useState<string>(
    props.toDate || moment().format('YYYY-MM-DD'),
  );
  const [pages, setPages] = useState<[LogResponseDto[]]>([[]]);
  const [page, setPage] = useState<number>(1);
  const [requests, setRequests] = useState<Request[]>([]);
  const [logs, setLogs] = useState<LogResponseDto[]>([]);
  const [simpleView, setSimpleView] = useState<boolean>(true);

  const [showWarnings, setShowWarnings] = useState<boolean>(
    props.showWarnings || false,
  );
  const [showErrors, setShowErrors] = useState<boolean>(
    props.showErrors || true,
  );
  const [showResults, setShowResults] = useState<boolean>(
    props.showResults || true,
  );
  const [showInfos, setShowInfos] = useState<boolean>(props.showInfos || true);
  const [showScrapperLogs, setShowScrapperLogs] = useState<boolean>(
    props.showScrapperLogs || true,
  );
  const [showAILogs, setShowAILogs] = useState<boolean>(
    props.showAILogs || true,
  );
  const [showQueueLogs, setShowQueueLogs] = useState<boolean>(
    props.showQueueLogs || false,
  );
  const [showApiLogs, setShowApiLogs] = useState<boolean>(
    props.showApiLogs || false,
  );
  const [hiddenLogs, setHiddenLogs] = useState<number>(0);
  const rowsPerPage = 50;

  const getLogs = async () => {
    const logs = await getLogByDate(fromDate, toDate);
    logs.sort((a, b) => {
      return moment(a.timestamp).isBefore(moment(b.timestamp)) ? 1 : -1;
    });
    setLogs(logs);
  };

  const filterLogs = () => {
    const pages: any = [];
    const filtered = logs.filter((l) => {
      if (props.requestId && l.requestId !== props.requestId) {
        return false;
      }
      if (props.productId && l.productId !== props.productId) {
        return false;
      }
      if (!showWarnings && l.type === 'WARNING') {
        return false;
      }
      if (!showErrors && l.type === 'ERROR') {
        return false;
      }
      if (!showResults && l.type === 'RESULT') {
        return false;
      }
      if (!showInfos && l.type === 'INFO') {
        return false;
      }
      if (!showScrapperLogs && l.origin === 'scrapper') {
        return false;
      }
      if (!showAILogs && l.origin === 'openai') {
        return false;
      }
      if (!showQueueLogs && l.origin === 'queues') {
        return false;
      }
      if (!showApiLogs && l.origin === 'api') {
        return false;
      }
      return true;
    });
    filtered.forEach((log, index) => {
      const itemPage = Math.floor(index / rowsPerPage);
      if (!pages[itemPage]) {
        pages[itemPage] = [];
      }
      pages[itemPage].push(log);
    });
    setPages(pages);
    setHiddenLogs(logs.length - filtered.length);
  };

  const getRequests = async () => {
    const requests = await findAllRequests();
    setRequests(requests);
  };

  useEffect(() => {
    getLogs();
    getRequests();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [
    logs,
    showWarnings,
    showErrors,
    showResults,
    showInfos,
    showScrapperLogs,
    showAILogs,
    showQueueLogs,
    showApiLogs,
  ]);

  return (
    <>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <Typography>Pending requests</Typography>
          {requests.length > 0 ? (
            <>
              {
                requests.filter(
                  (r: Request) =>
                    r.status === RequestStatus.PENDING ||
                    r.status === RequestStatus.IN_PROGRESS,
                ).length
              }
              {'/'}
              {requests.length}
            </>
          ) : (
            <>{'--/--'}</>
          )}
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography>Viewing logs</Typography>
          {logs.length > 0 ? (
            <>
              {logs.length - hiddenLogs}
              {'/'}
              {logs.length}
            </>
          ) : (
            <>{'--/--'}</>
          )}
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={3}>
          <Typography>From</Typography>
          <DatePicker
            onChange={(e) => setFromDate(moment(e).format('YYYY-MM-DD'))}
            defaultValue={moment(fromDate)}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography>To</Typography>
          <DatePicker
            onChange={(e) => setToDate(moment(e).format('YYYY-MM-DD'))}
            defaultValue={moment(toDate)}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={2}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Button variant="outlined" onClick={getLogs}>
            Get Logs
          </Button>
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            value="top"
            control={
              <Switch
                checked={simpleView}
                onChange={() => setSimpleView(!simpleView)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Simple View"
            labelPlacement="top"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showWarnings}
                onChange={() => setShowWarnings(!showWarnings)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Warnings"
            labelPlacement="start"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showErrors}
                onChange={() => setShowErrors(!showErrors)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Errors"
            labelPlacement="start"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showInfos}
                onChange={() => setShowInfos(!showInfos)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Info"
            labelPlacement="start"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showResults}
                onChange={() => setShowResults(!showResults)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Results"
            labelPlacement="start"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showAILogs}
                onChange={() => setShowAILogs(!showAILogs)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="AI"
            labelPlacement="start"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showApiLogs}
                onChange={() => setShowApiLogs(!showApiLogs)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="API"
            labelPlacement="start"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showQueueLogs}
                onChange={() => setShowQueueLogs(!showQueueLogs)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Queue"
            labelPlacement="start"
          />
          <FormControlLabel
            value="start"
            control={
              <Checkbox
                checked={showScrapperLogs}
                onChange={() => setShowScrapperLogs(!showScrapperLogs)}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Scrapper"
            labelPlacement="start"
          />
        </Grid>
      </Grid>
      {simpleView ? (
        <SimpleLog logs={pages[page - 1]} />
      ) : (
        <GroupedLogs logs={pages[page - 1]} />
      )}

      <Pagination
        count={pages.length}
        onChange={(e, value) => setPage(value)}
      />
    </>
  );
}
