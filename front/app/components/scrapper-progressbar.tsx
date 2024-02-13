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

interface ScrapperProgressbarProps {
  productId: string;
}

export default function ScrapperProgressbar({
  productId,
}: ScrapperProgressbarProps) {
  const [findInMarkets, setFindInMarkets] = useState<boolean>(false);
  const [readProducts, setReadProducts] = useState<boolean>(false);
  const [matching, setMatching] = useState<boolean>(false);
  const [readReviews, setReadReviews] = useState<boolean>(false);
  const [buildFacts, setBuildFacts] = useState<boolean>(false);

  const getRequests = async () => {
    const requests = await findRequestsByProduct(productId);
    const product = await getProduct(productId);
    if (requests.length > 0) {
      if (
        !requests.find(
          (r) =>
            r.type === RequestType.FIND_PRODUCT &&
            r.status === RequestStatus.PENDING,
        )
      ) {
        setFindInMarkets(true);
      }

      if (product.matches && product.matches.length > 0) {
        const matchIds = product.matches.map((m) => m.product._id);
        if (
          requests.find((r) => r.type === RequestType.GET_PRODUCT_INFO) &&
          !requests.find(
            (r) =>
              matchIds.includes(r.productId) &&
              r.type === RequestType.GET_PRODUCT_INFO &&
              r.status === RequestStatus.PENDING,
          )
        ) {
          setReadProducts(true);
        }

        if (!product.matches.find((m) => m.percentage.length === 0)) {
          setMatching(true);
        }

        if (
          requests.find((r) => r.type === RequestType.GET_REVIEWS) &&
          !requests.find(
            (r) =>
              matchIds.includes(r.productId) &&
              r.type === RequestType.GET_REVIEWS &&
              r.status === RequestStatus.PENDING,
          )
        ) {
          setReadReviews(true);
        }

        if (product.facts && product.facts.length > 0) {
          setBuildFacts(true);
        }
      }
    }
  };

  useEffect(() => {
    getRequests();
  }, [productId]);

  return (
    <>
      <Timeline position="left">
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={findInMarkets ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Find in marketplaces</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={readProducts ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Read products</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={matching ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Matching</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={readReviews ? 'filled' : 'outlined'}
            />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>Read reviews</TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot
              color="success"
              variant={buildFacts ? 'filled' : 'outlined'}
            />
          </TimelineSeparator>
          <TimelineContent>Build facts</TimelineContent>
        </TimelineItem>
      </Timeline>
    </>
  );
}
