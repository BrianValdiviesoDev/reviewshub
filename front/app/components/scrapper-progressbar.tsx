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
import { Box, Grid, LinearProgress, Typography } from '@mui/material';

interface ScrapperProgressbarProps {
  productId: string;
  productPipeline?: Pipeline;
  totalRequests?: number;
  pendingRequests?: number;
}

export default function ScrapperProgressbar({
  productId,
  productPipeline,
  totalRequests,
  pendingRequests,
}: ScrapperProgressbarProps) {
  const [step, setStep] = useState<string>()
  const [icon, setIcon] = useState<string>()
  const [progress, setProgress] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(33);
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

  const getStep =()=>{
    console.log(pipeline)
    if(!pipeline.findInMarketplaces){
      setIcon('/find-in-marketplaces.gif')
      setStep('Buscando en marketplaces...')
      return;
    }

    if(!pipeline.readProducts && !pipeline.matching){
      setIcon('/reading-products.gif')
      setStep('Comparando productos...')
      return;
    }

    if(!pipeline.readReviews){
      setIcon('/reading-reviews.gif')
      setStep('Leyendo reviews...')
      return;
    }

    if(!pipeline.buildFacts){
      setIcon('/building-facts.gif')
      setStep('Obteniendo conclusiones...')
      return;
    }

    if(!pipeline.done){
      setIcon('/generating-reviews.gif')
      setStep('Generando reviews...')
      return;
    }

    setIcon(undefined)
    setStep(undefined)
  }

  useEffect(() => {
    getStep();
  }, [pipeline]);

  useEffect(() => {
    //Total = requests + build facts + generate reviews 
    const totalSteps = 2 + (totalRequests || 0)
    console.log('totalSteps', totalSteps)
    let progress = (totalRequests || 0) - (pendingRequests || 0);
    if(pipeline.buildFacts){
      progress += 1;
    }
    if(pipeline.done){
      progress = totalSteps;
    }

    console.log('progress', progress)
    setTotalSteps(totalSteps)
    progress = (progress / totalSteps) * 100;
    console.log('progress', progress)
    setProgress(progress);
  }, [totalRequests, pendingRequests, pipeline]);

  return (
    <>
    {icon && step && !pipeline.done && (
      <Grid container spacing={2} direction="column"
      alignItems="center"
      justifyContent="center">
      <Grid item xs={12}>
        <Typography variant='h3'>{step}</Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Image src={icon} alt={''} width={200} height={200}/>
      </Grid>
    </Grid>
    )}
    
    </>

  );
}
