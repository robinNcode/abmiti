import { useEffect, useState, useMemo } from 'react';
import { siteApi } from '@/api/site.api';
import { Search, Users, Mail, Calendar, ShieldCheck, User } from 'lucide-react';
import { UserAvatar } from '@/components/ui';

interface UserItem {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  userType?: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    siteApi
      .adminUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.userType?.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-terra-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">Users</h1>
        <p className="text-sm text-white/35 mt-0.5">{users.length} registered users</p>
      </div>

      {/* Toolbar */}
      <div className="admin-card mb-4 !p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input pl-9 w-full"
          />
        </div>
      </div>

      {/* Users List / Table */}
      {filtered.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <Users size={32} className="text-white/10 mx-auto mb-3" />
          <p className="text-sm font-medium text-white/40">No users found</p>
          {search && <p className="text-xs text-white/20 mt-1">Try clearing your search query</p>}
        </div>
      ) : (
        <div className="admin-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-white/35 font-medium uppercase tracking-wider bg-white/[0.02]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((u, idx) => {
                  const id = u._id ?? u.id ?? String(idx);
                  const role = u.userType ?? u.role ?? 'user';
                  const isAdmin = role === 'admin';

                  return (
                    <tr key={id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar avatar={u.avatar} name={u.name} sizeClassName="w-8 h-8 text-xs" />
                          <span className="font-semibold text-white/90">{u.name || 'Unnamed User'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-white/50">
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-white/25 shrink-0" />
                          <span className="truncate max-w-[200px]">{u.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-terra/15 text-terra-light border border-terra/30'
                              : 'bg-white/[0.06] text-white/50 border border-white/[0.06]'
                          }`}
                        >
                          {isAdmin ? <ShieldCheck size={10} /> : <User size={10} />}
                          {role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-white/35">
                        <div className="flex items-center justify-end gap-1.5">
                          <Calendar size={12} className="text-white/20 shrink-0" />
                          <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
