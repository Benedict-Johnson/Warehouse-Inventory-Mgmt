import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Reservation } from "@/lib/types";

interface ReservationBannerProps {
  reservation: Reservation;
  productName: string;
  warehouseName: string;
  onCleared: () => void;
}

export function ReservationBanner({ reservation, productName, warehouseName, onCleared }: ReservationBannerProps) {
  const calculateTimeLeft = useCallback(() => {
    const expiresAt = new Date(reservation.expiresAt).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((expiresAt - now) / 1000));
  }, [reservation.expiresAt]);

  const [timeLeft, setTimeLeft] = useState<number>(calculateTimeLeft);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"PENDING" | "CONFIRMED" | "EXPIRED" | "ERROR">("PENDING");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    
    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        if (status === "PENDING") {
          setStatus("EXPIRED");
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, status]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 410) {
          setStatus("EXPIRED");
        } else {
          setStatus("ERROR");
          setErrorMessage(data.message || "Confirmation failed");
        }
        return;
      }

      setStatus("CONFIRMED");
      setTimeout(() => {
        onCleared();
      }, 3000);
    } catch (err: unknown) {
      setStatus("ERROR");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "POST",
      });
      onCleared();
    } catch {
      // Best effort release
      onCleared();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "CONFIRMED") {
    return (
      <div className="sticky top-0 z-40 w-full bg-green-500 text-white p-4 text-center shadow-md animate-in fade-in slide-in-from-top-4">
        <p className="font-semibold text-lg">✓ Order Confirmed!</p>
        <p className="text-sm">Your reservation for {reservation.quantity}x {productName} is complete.</p>
      </div>
    );
  }

  const isUrgent = timeLeft > 0 && timeLeft < 60;

  return (
    <div className={`sticky top-0 z-40 w-full p-4 shadow-md transition-colors duration-300 ${status === "EXPIRED" || status === "ERROR" ? "bg-red-500 text-white" : "bg-blue-50 border-b border-blue-200 dark:bg-blue-950 dark:border-blue-900"}`}>
      <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold dark:text-white text-blue-950">
            {status === "EXPIRED" ? "Reservation Expired" : status === "ERROR" ? "Error" : "Action Required"}
          </h3>
          <p className="text-sm dark:text-blue-100 text-blue-800">
            {status === "EXPIRED" 
              ? "Your reserved items have been released back to stock."
              : status === "ERROR"
              ? errorMessage
              : `You have reserved ${reservation.quantity}x ${productName} from ${warehouseName}.`}
          </p>
        </div>

        {status === "PENDING" && (
          <div className="flex items-center gap-4">
            <div className={`font-mono text-xl font-bold ${isUrgent ? "text-red-500 dark:text-red-400 animate-pulse" : "text-blue-600 dark:text-blue-300"}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading} className="bg-white/50 hover:bg-white dark:bg-blue-900/50">
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={loading || timeLeft <= 0} className="bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? "Confirming..." : "Confirm Purchase"}
              </Button>
            </div>
          </div>
        )}

        {(status === "EXPIRED" || status === "ERROR") && (
          <Button variant="outline" size="sm" onClick={onCleared} className="bg-transparent border-white text-white hover:bg-white/20">
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
