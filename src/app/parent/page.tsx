import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, ShieldAlert, BadgePlus, Users, Settings } from 'lucide-react'

export default async function ParentDashboard() {
    const cookieStore = await cookies()
    const role = cookieStore.get('dodoo_role')?.value

    if (role !== 'PARENT') {
        redirect('/')
    }

    return (
        <div className="min-h-dvh flex flex-col relative overflow-hidden bg-slate-50 text-slate-800">
            <header className="px-6 py-4 bg-white shadow-sm flex items-center gap-4">
                <Link href="/" className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-500" />
                </Link>
                <h1 className="text-xl font-bold">Parent Dashboard (家长模式)</h1>
            </header>

            <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mb-2">
                            <Star className="w-6 h-6 text-yellow-500" />
                        </div>
                        <h2 className="text-xl font-bold">Manual Rewards</h2>
                        <p className="text-slate-500 text-sm">Add or remove Stars manually for the child.</p>
                        <button className="mt-auto px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold transition-colors">
                            Manage Stars
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-2">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold">Emotion Penalties</h2>
                        <p className="text-slate-500 text-sm">Record anger outbursts or manage existing penalties.</p>
                        <button className="mt-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors">
                            Record Behavior
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-2">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold">Family Accounts</h2>
                        <p className="text-slate-500 text-sm">Update child info or change parent PIN.</p>
                        <button className="mt-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
                            Manage Users
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                            <Settings className="w-6 h-6 text-purple-500" />
                        </div>
                        <h2 className="text-xl font-bold">App Settings</h2>
                        <p className="text-slate-500 text-sm">Configure app-wide parameters and features.</p>
                        <button className="mt-auto px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors">
                            Settings
                        </button>
                    </div>

                </div>
            </main>
        </div>
    )
}
