import { useEffect, useState } from 'react';
import {
  findAllRequests,
  findRequestsByProduct,
} from '../api/requests.service';
import {
  Request,
  RequestStatus,
  RequestType,
} from '../entities/request.entity';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { getProduct } from '../api/products.service';
import { Pipeline } from '../entities/product.entity';
import useSocketListener from '../sockets/listener';
import { EventTypes } from '../entities/event.entity';

interface ScrapperProgressbarProps {
  productId: string;
  productPipeline?: Pipeline;
}

export default function ScrapperProgressbar({
  productId,
  productPipeline,
}: ScrapperProgressbarProps) {
  const [pipeline, setPipeline] = useState<Pipeline>(productPipeline ||{
    findInMarketplaces: false,
    readProducts: false,
    matching: false,
    readReviews: false,
    buildFacts: false,
    done: false,
  });

  const sockets = useSocketListener( (event: EventTypes, data: any) => {
      if(event === EventTypes.pipeline_updated && data.productId === productId){
        setPipeline(data.pipeline as Pipeline)
      }
  });

  return (
    <>
      <Timeline position="left">
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={pipeline.findInMarketplaces ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Find in marketplaces</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={pipeline.readProducts ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Read products</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={pipeline.matching ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Matching</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={pipeline.readReviews ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Read reviews</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={pipeline.buildFacts ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Build facts</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={pipeline.done ? 'filled' : 'outlined'}
            />
          </TimelineSeparator>
          <TimelineContent>Done</TimelineContent>
        </TimelineItem>
      </Timeline>
      
    </>
  );
}
