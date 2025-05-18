import { useState } from "react";
import AppLayout from "@/components/layout/app-layout";
import StatsCard from "@/components/dashboard/stats-card";
import MembersTable from "@/components/dashboard/members-table";
import ExpiringMembers from "@/components/dashboard/expiring-members";
import MemberDetailsModal from "@/components/member/member-details-modal";
import { Member } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useExpiringMembers } from "@/hooks/useExpiringMembers";

export default function DashboardPage() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: expiringMembers, isLoading: isLoadingExpiring } =
    useExpiringMembers();

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Overview of your gym's membership status
          </p>
        </header>

        {/* Dashboard Stats */}
        {isLoadingStats ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Members"
              value={stats?.totalMembers || 0}
              icon="users"
              color="primary"
            />
            <StatsCard
              title="Monthly Joined"
              value={stats?.monthlyJoined || 0}
              icon="user-plus"
              color="success"
            />
            <StatsCard
              title="Expiring soon"
              value={stats?.expiringThreeDays || 0}
              icon="clock"
              color="warning"
            />
            <StatsCard
              title="Expired Members"
              value={stats?.expiredMembers || 0}
              icon="alert-triangle"
              color="danger"
            />
          </div>
        )}

        {/* Members Table */}
        <div className="mb-6">
          <MembersTable onViewMember={handleViewMember} />
        </div>

        {/* Expiring Soon Section */}
        {isLoadingExpiring ? (
          <div className="flex justify-center my-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ExpiringMembers
            members={Array.isArray(expiringMembers) ? expiringMembers : []}
            onViewMember={handleViewMember}
          />
        )}
      </div>

      {/* Member Details Modal */}
      <MemberDetailsModal
        member={selectedMember}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </AppLayout>
  );
}
