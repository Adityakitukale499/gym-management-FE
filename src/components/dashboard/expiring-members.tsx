import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Member } from "@shared/schema";
import { format, differenceInDays } from "date-fns";

interface ExpiringMembersProps {
  members: Member[];
  onViewMember: (member: Member) => void;
}

export default function ExpiringMembers({
  members,
  onViewMember,
}: ExpiringMembersProps) {
  const getDaysUntilExpiration = (nextBillDate: string) => {
    const today = new Date();
    const expirationDate = new Date(nextBillDate);
    return differenceInDays(expirationDate, today);
  };

  if (members.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expiring Soon</CardTitle>
        <span className="text-sm text-gray-500">
          Members with membership expiring within 3 days
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start">
                {member.photo ? (
                  <img
                    className="h-12 w-12 rounded-full object-cover mr-4"
                    src={member.photo}
                    alt={member.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <span className="text-gray-500 font-medium">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.phone}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs font-medium text-red-600">
                      Expires:{" "}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      {format(new Date(member.nextBillDate), "MMM dd, yyyy")} (
                      {getDaysUntilExpiration(member.nextBillDate)} days)
                    </span>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => onViewMember(member)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
