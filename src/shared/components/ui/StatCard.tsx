type StatCardprops = {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: "up" | "down" | "neutral";
};

export function StatCard({ label, value, icon, trend }: StatCardprops) {
    return (
        <div className="bg-white rounded-x1 shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm">{label}</span>
                {icon && <span className="text-blue-500">{icon}</span>}
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div> 
    );
}