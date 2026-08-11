import { RestaurantForm } from "@/components/admin/RestaurantForm";

export default function NewRestaurantPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New restaurant
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Fill in what you know — you can edit anything later.
        </p>
      </div>
      <RestaurantForm />
    </div>
  );
}
