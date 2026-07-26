import PaymentLinkPage from '../../../payment/[id]/page';
import {
  isSamplePaymentLink,
  SAMPLE_PAYMENT_INTENT,
  SAMPLE_PAYMENT_PROVIDER,
} from '@/src/lib/sample-payment-link';

type PaymentRouteProps = {
  params: Promise<{
    provider: string;
    id: string;
  }>;
};

export default async function PaymentRoute({ params }: PaymentRouteProps) {
  const { provider, id } = await params;

  if (isSamplePaymentLink(provider, id)) {
    return (
      <PaymentLinkPage
        previewIntent={SAMPLE_PAYMENT_INTENT}
        previewProviderHandle={SAMPLE_PAYMENT_PROVIDER}
      />
    );
  }

  return <PaymentLinkPage />;
}
