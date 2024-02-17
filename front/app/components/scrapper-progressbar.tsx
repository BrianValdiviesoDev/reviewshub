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
import Image from 'next/image';

interface ScrapperProgressbarProps {
  productId: string;
  productPipeline?: Pipeline;
}

export default function ScrapperProgressbar({
  productId,
  productPipeline,
}: ScrapperProgressbarProps) {
  const [pipeline, setPipeline] = useState<Pipeline>(
    productPipeline || {
      findInMarketplaces: false,
      readProducts: false,
      matching: false,
      readReviews: false,
      buildFacts: false,
      done: false,
    },
  );

  const sockets = useSocketListener((event: EventTypes, data: any) => {
    if (event === EventTypes.pipeline_updated && data.productId === productId) {
      setPipeline(data.pipeline as Pipeline);
    }
  });

  const getIcon =()=>{
    if(!pipeline.findInMarketplaces){
      return <Image src="/find-in-marketplaces.gif" alt={''} width={200} height={200}/>
    }

    if(!pipeline.readProducts && !pipeline.matching){
      return <Image src="/reading-products-2.gif" alt={''} width={200} height={200}/>
    }

    if(!pipeline.readReviews){
      return <Image src="/reading-reviews.gif" alt={''} width={200} height={200}/>
    }

    if(!pipeline.buildFacts){
      return <Image src="/building-facts.gif" alt={''} width={200} height={200}/>
    }

    if(!pipeline.done){
      return <Image src="/generating-reviews.gif" alt={''} width={200} height={200}/>
    }
  }

  return (
    <>
    {getIcon()}
    </>

  );
}
