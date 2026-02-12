import DefineLayout from '../dashboard/layout';

export default function TransactionsPage() {
  return (
    <DefineLayout>
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-4xl lg:text-5xl">
          No transactions yet
        </h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500 sm:text-base">
          Your protected payment links and payouts will show up here.
        </p>
      </div>
    </DefineLayout>
  );
}
