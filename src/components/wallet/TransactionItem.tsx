
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export interface Transaction {
  id: string;
  type: "incoming" | "outgoing";
  amount: number;
  sender?: string;
  recipient?: string;
  date: Date;
  status: "completed" | "pending" | "failed";
}

interface TransactionItemProps {
  transaction: Transaction;
  className?: string;
}

const TransactionItem = ({ transaction, className }: TransactionItemProps) => {
  const isIncoming = transaction.type === "incoming";
  
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer",
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isIncoming ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600",
        )}>
          {isIncoming ? (
            <ArrowDownLeft size={20} />
          ) : (
            <ArrowUpRight size={20} />
          )}
        </div>
        <div>
          <p className="font-medium">
            {isIncoming ? `From ${transaction.sender}` : `To ${transaction.recipient}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {transaction.date.toLocaleDateString()} • {transaction.status}
          </p>
        </div>
      </div>
      <div className={cn(
        "font-semibold",
        isIncoming ? "text-green-600" : "text-blue-600"
      )}>
        {isIncoming ? "+" : "-"}
        {transaction.amount} M
      </div>
    </div>
  );
};

export default TransactionItem;
