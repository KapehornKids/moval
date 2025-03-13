
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { CardCustom, CardHeader, CardTitle, CardContent } from '@/components/ui/card-custom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ButtonCustom } from '@/components/ui/button-custom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const BankerAdmin = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanInterest, setLoanInterest] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [loanDueDate, setLoanDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  useEffect(() => {
    const checkAccess = async () => {
      const hasBankerRole = await hasRole('banker');
      if (!hasBankerRole) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the Banker Admin page",
          variant: "destructive",
        });
        navigate("/dashboard");
      } else {
        fetchUsers();
      }
    };

    checkAccess();
  }, [navigate, hasRole]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name');

      if (error) throw error;

      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setLoanAmount(value);
    }
  };

  const handleLoanInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setLoanInterest(value);
    }
  };

  const giveMovals = async () => {
    if (!selectedUser || !amount) {
      toast({
        title: 'Error',
        description: 'Please select a user and enter an amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const amountNumber = parseFloat(amount);

      // Update wallet balance
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        _user_id: selectedUser,
        _amount: amountNumber
      });

      if (walletError) throw walletError;

      toast({
        title: 'Success',
        description: `Successfully gave ${amount} Movals to user.`,
      });

      // Reset form
      setAmount('');
    } catch (error: any) {
      console.error('Error giving Movals:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to give Movals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createLoan = async () => {
    if (!selectedUser || !loanAmount || !loanInterest || !loanPurpose || !loanDueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all loan details.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const amountNumber = parseFloat(loanAmount);
      const interestNumber = parseFloat(loanInterest);
      const dueDate = new Date(loanDueDate).toISOString();

      // Create loan
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .insert([
          {
            user_id: selectedUser,
            amount: amountNumber,
            interest_rate: interestNumber,
            purpose: loanPurpose,
            repayment_due_date: dueDate,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (loanError) throw loanError;

      // Update wallet balance
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        _user_id: selectedUser,
        _amount: amountNumber
      });

      if (walletError) throw walletError;

      toast({
        title: 'Success',
        description: `Successfully created loan for user.`,
      });

      // Reset form
      setLoanAmount('');
      setLoanInterest('');
      setLoanPurpose('');
      setLoanDueDate('');
    } catch (error: any) {
      console.error('Error creating loan:', error);
      toast({
        title: 'Error',
        description: error.message || 'Unable to create loan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in">Banker Admin</h1>
          <p className="text-muted-foreground animate-fade-in">
            Manage user wallets and loans
          </p>
        </div>

        <CardCustom className="glass-card">
          <CardHeader>
            <CardTitle>Give Movals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Label htmlFor="user">Select User</Label>
              <Select onValueChange={(value) => setSelectedUser(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              <Label htmlFor="amount">Amount (Movals)</Label>
              <Input
                id="amount"
                placeholder="Enter amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="glass-effect"
              />
            </div>

            <ButtonCustom
              onClick={giveMovals}
              disabled={isLoading || !selectedUser || !amount}
              className="w-full"
            >
              {isLoading ? 'Giving Movals...' : 'Give Movals'}
              <PlusCircle className="w-4 h-4 ml-2" />
            </ButtonCustom>
          </CardContent>
        </CardCustom>

        <CardCustom className="glass-card mt-8">
          <CardHeader>
            <CardTitle>Create Loan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Label htmlFor="loanUser">Select User</Label>
              <Select onValueChange={(value) => setSelectedUser(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              <Label htmlFor="loanAmount">Loan Amount (Movals)</Label>
              <Input
                id="loanAmount"
                placeholder="Enter loan amount"
                type="text"
                value={loanAmount}
                onChange={handleLoanAmountChange}
                className="glass-effect"
              />
            </div>

            <div className="grid gap-4">
              <Label htmlFor="loanInterest">Interest Rate (%)</Label>
              <Input
                id="loanInterest"
                placeholder="Enter interest rate"
                type="text"
                value={loanInterest}
                onChange={handleLoanInterestChange}
                className="glass-effect"
              />
            </div>

            <div className="grid gap-4">
              <Label htmlFor="loanPurpose">Purpose</Label>
              <Input
                id="loanPurpose"
                placeholder="Enter purpose"
                type="text"
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value)}
                className="glass-effect"
              />
            </div>

            <div className="grid gap-4">
              <Label htmlFor="loanDueDate">Repayment Due Date</Label>
              <Input
                id="loanDueDate"
                type="date"
                value={loanDueDate}
                onChange={(e) => setLoanDueDate(e.target.value)}
                className="glass-effect"
              />
            </div>

            <ButtonCustom
              onClick={createLoan}
              disabled={isLoading || !selectedUser || !loanAmount || !loanInterest || !loanPurpose || !loanDueDate}
              className="w-full"
            >
              {isLoading ? 'Creating Loan...' : 'Create Loan'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </ButtonCustom>
          </CardContent>
        </CardCustom>
      </div>
    </Layout>
  );
};

export default BankerAdmin;
