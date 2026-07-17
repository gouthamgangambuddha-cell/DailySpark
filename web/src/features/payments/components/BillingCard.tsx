import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paymentsApi } from "../api/paymentsApi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function BillingCard() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["payments", "subscription"],
    queryFn: paymentsApi.getSubscription,
  });

  const handleManageBilling = async () => {
    setIsRedirecting(true);
    try {
      const url = await paymentsApi.createPortalSession();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not open billing portal.");
      setIsRedirecting(false);
    }
  };

  const handleUpgrade = async () => {
    setIsRedirecting(true);
    try {
      const url = await paymentsApi.createCheckoutSession("monthly");
      window.location.href = url;
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not start checkout.");
      setIsRedirecting(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-ink dark:text-paper">Billing</h2>

      {isLoading ? (
        <div className="mt-3 h-6 w-40 animate-pulse rounded bg-paper-dim dark:bg-white/5" />
      ) : subscription?.isPremium ? (
        <>
          <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
            You're on <span className="font-semibold text-spark-700 dark:text-spark-300">Premium</span>.
            {subscription.cancelAtPeriodEnd
              ? ` Your plan ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`
              : ` Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}.`}
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            isLoading={isRedirecting}
            onClick={handleManageBilling}
          >
            Manage billing
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
            You're on the free plan. Upgrade for unlimited AI explanations, offline mode, and more.
          </p>
          <Button className="mt-4" isLoading={isRedirecting} onClick={handleUpgrade}>
            Upgrade to Premium
          </Button>
        </>
      )}
    </Card>
  );
}
