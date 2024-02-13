'use client';
import { LogResponseDto } from '../entities/log.entity';
import { useEffect, useState } from 'react';
import moment from 'moment';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from '@mui/lab/TimelineOppositeContent';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  Link,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import QueueIcon from '@mui/icons-material/Queue';
import WebhookIcon from '@mui/icons-material/Webhook';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ImageIcon from '@mui/icons-material/Image';

interface LogProps {
  logs: LogResponseDto[];
}
export default function GroupedLogs({ logs }: LogProps) {
  const [requestsLogs, setRequestsLogs] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  const getPointerColor = (type: string) => {
    if (type == 'ERROR') {
      return 'error';
    } else if (type == 'WARNING') {
      return 'warning';
    } else if (type == 'RESULT') {
      return 'success';
    }
    return 'info';
  };

  const getOriginIcon = (origin: string) => {
    if (origin === 'openai') {
      return <SmartToyIcon />;
    } else if (origin === 'scrapper') {
      return <TravelExploreIcon />;
    } else if (origin === 'queues') {
      return <QueueIcon />;
    } else if (origin === 'api') {
      return <WebhookIcon />;
    } else {
      return <>{origin}</>;
    }
  };

  useEffect(() => {
    const groupedByRequests = logs.reduce((acc: any, log) => {
      const requestId = log.requestId;
      if (!log.requestId || requestId === 'None') {
        const date = moment(log.timestamp).format('YYYY-MM-DD');
        acc[date] = [];
        acc[date].push(log);
        return acc;
      }
      if (!acc[requestId]) {
        acc[requestId] = [];
      }
      acc[requestId].push(log);
      return acc;
    }, {});
    setRequestsLogs(groupedByRequests);
  }, [logs]);
  return (
    <>
      {requestsLogs && Object.keys(requestsLogs).length > 0 && (
        <Timeline
          sx={{
            [`& .${timelineOppositeContentClasses.root}`]: {
              flex: 0.2,
            },
          }}
        >
          {Object.keys(requestsLogs).map((requestId: string, index) => {
            const logs = requestsLogs[requestId as any];
            const log = logs[0];
            let color: string = getPointerColor(log.type);
            if (logs.find((f: any) => f.type === 'RESULT')) {
              color = getPointerColor('RESULT');
            } else if (logs.find((f: any) => f.type === 'ERROR')) {
              color = getPointerColor('ERROR');
            }

            return (
              <TimelineItem key={index}>
                <TimelineOppositeContent color="textSecondary">
                  {log.productId && log.productId !== 'None' && (
                    <Link href={`products/${log.productId}`} target="_blank">
                      <IconButton>
                        <VisibilityIcon />
                      </IconButton>
                    </Link>
                  )}
                  {moment(log.timestamp).format('DD/MM/YYYY HH:mm')}
                  {getOriginIcon(log.origin)}
                </TimelineOppositeContent>
                {log.data && log.data.includes('screenshot') && (
                  <Link
                    href={`${process.env.NEXT_PUBLIC_SCRAPPER_URL}/${
                      JSON.parse(log.data).screenshot
                    }`}
                    target="_blank"
                    rel="noopener"
                  >
                    <ImageIcon />
                  </Link>
                )}
                <TimelineSeparator>
                  <TimelineDot
                    color={
                      color as
                        | 'info'
                        | 'inherit'
                        | 'grey'
                        | 'primary'
                        | 'secondary'
                        | 'error'
                        | 'success'
                        | 'warning'
                    }
                  />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  {logs.length === 1 ? (
                    <>
                      {log.message}
                      {log.data && log.data !== 'None' && (
                        <>
                          <Tooltip title={log.data}>
                            <InfoOutlinedIcon />
                          </Tooltip>
                          {log.data.includes('screenshot') && (
                            <Link
                              href={`${process.env.NEXT_PUBLIC_SCRAPPER_URL}/${
                                JSON.parse(log.data).screenshot
                              }`}
                              target="_blank"
                              rel="noopener"
                            >
                              <ImageIcon />
                            </Link>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <Accordion
                      expanded={expanded === `${requestId}-header`}
                      onChange={handleChange(`${requestId}-header`)}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        id={`${requestId}-header`}
                      >
                        <Typography sx={{ width: '33%', flexShrink: 0 }}>
                          {log.message}
                          {` (${logs.length})`}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {logs.length > 1 && (
                          <Timeline
                            sx={{
                              [`& .${timelineOppositeContentClasses.root}`]: {
                                flex: 0.2,
                              },
                            }}
                          >
                            {logs.map((log: any, index: number) => {
                              let color: string = getPointerColor(log.type);

                              return (
                                <TimelineItem key={index}>
                                  <TimelineOppositeContent color="textSecondary">
                                    {moment(log.timestamp).format(
                                      'DD/MM/YYYY HH:mm',
                                    )}
                                    {getOriginIcon(log.origin)}
                                  </TimelineOppositeContent>
                                  <TimelineSeparator>
                                    <TimelineDot
                                      color={
                                        color as
                                          | 'info'
                                          | 'inherit'
                                          | 'grey'
                                          | 'primary'
                                          | 'secondary'
                                          | 'error'
                                          | 'success'
                                          | 'warning'
                                      }
                                    />
                                    <TimelineConnector />
                                  </TimelineSeparator>
                                  <TimelineContent>
                                    {log.message}
                                    {log.data && log.data !== 'None' && (
                                      <>
                                        <Tooltip title={log.data}>
                                          <InfoOutlinedIcon />
                                        </Tooltip>
                                        {log.data.includes('screenshot') && (
                                          <Link
                                            href={`${
                                              process.env
                                                .NEXT_PUBLIC_SCRAPPER_URL
                                            }/${
                                              JSON.parse(log.data).screenshot
                                            }`}
                                            target="_blank"
                                            rel="noopener"
                                          >
                                            <ImageIcon />
                                          </Link>
                                        )}
                                      </>
                                    )}
                                  </TimelineContent>
                                </TimelineItem>
                              );
                            })}
                          </Timeline>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </>
  );
}
