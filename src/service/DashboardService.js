import { DashboardModel } from '../models/DashboardModel.js';

export class DashboardService {
    static async getHRDashboard(orgId) {
        console.log('[DASHBOARD SERVICE] Fetching for orgId:', orgId);
        const [totalLearners, averageCompletion, overdueCourses, activeAssignments, topPerformers, completionByDepartment, courseStatus] = await Promise.all([

            DashboardModel.getTotalLearners(orgId),
            DashboardModel.getAverageCompletion(orgId),
            DashboardModel.getOverdueCourses(orgId),
            DashboardModel.getActiveAssignments(orgId),
            DashboardModel.getTopPerformers(orgId),
            DashboardModel.getCompletionByDepartment(orgId),
            DashboardModel.getCourseStatus(orgId)
        ]);

        return {
            totalLearners,
            averageCompletion: Math.round(averageCompletion * 100) / 100,  // 2 decimals
            overdueCourses,
            activeAssignments,
            topPerformers,
            completionByDepartment,
            courseStatus
        };
    }

    static async getSuperAdminDashboard() {
        console.log('[DASHBOARD SERVICE SUPER] Fetching global dashboard');
        const [activeLearners, completionRate, averageSession, systemLoad, recentActivities, learningActivityGraph, recentActivity, criticalAlerts] = await Promise.all([
            DashboardModel.getActiveLearners(),
            DashboardModel.getCompletionRate(),
            //DashboardModel.getAverageSession(),
            DashboardModel.getSystemLoad(),
            DashboardModel.getRecentActivities(),
            DashboardModel.getLearningActivityGraph(),
            DashboardModel.getRecentActivity(),
            // DashboardModel.getCriticalAlerts()
        ]);

        return {
            activeLearners,
            completionRate: Math.round(completionRate * 100) / 100,
            averageSession,
            systemLoad,
            recentActivities,
            learningActivityGraph,  // For frontend line chart
            recentActivity,
            //criticalAlerts
        };
    }
}