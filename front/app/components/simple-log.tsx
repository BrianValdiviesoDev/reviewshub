import { LogResponseDto } from '../entities/log.entity';
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
import { Link, Tooltip } from '@mui/material';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import QueueIcon from '@mui/icons-material/Queue';
import WebhookIcon from '@mui/icons-material/Webhook';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ImageIcon from '@mui/icons-material/Image';

interface LogProps {
  logs: LogResponseDto[];
}
export default function SimpleLog({ logs }: LogProps) {
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
  return (
    <>
      {logs && logs.length > 0 && (
        <Timeline
          sx={{
            [`& .${timelineOppositeContentClasses.root}`]: {
              flex: 0.2,
            },
          }}
        >
          {logs.map((log, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="textSecondary">
                {moment(log.timestamp).format('DD/MM/YYYY HH:mm')}
                {getOriginIcon(log.origin)}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot
                  color={
                    getPointerColor(log.type) as
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
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </>
  );
}
