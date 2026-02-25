import { Skeleton } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="space-y-8 p-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-10 w-[300px] mb-2" />
                    <Skeleton className="h-4 w-[250px]" />
                </div>
                <Skeleton className="h-8 w-[150px] rounded-full" />
            </div>

            {/* Stats Cards Skeleton */}
            <div>
                <Skeleton className="h-8 w-[200px] mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[60px]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Extended Layout Skeleton */}
            <div>
                <Skeleton className="h-8 w-[200px] mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                </div>
                                <Skeleton className="h-6 w-[150px] mt-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
