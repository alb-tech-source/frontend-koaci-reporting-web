import {useQuery} from '@tanstack/react-query';
import api from "@/shared/lib/axios";

export function useInvestors(page: number, search: string) {
    return useQuery({
        queryKey: ['investors', page, search],
        queryFn: async () => {
            const { data } = await api.get('/investors', {
                params: { page, search }
            });
            return data;
        }
    });
}