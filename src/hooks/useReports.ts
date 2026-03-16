import { useState, useEffect, useCallback } from "react";
import type { DailyReport, WeeklyReport } from "../types";
import * as tauri from "../lib/tauri";
import { getWeekStart, toDateString } from "../lib/format";

export function useReports() {
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(
    toDateString(getWeekStart(new Date())),
  );
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDaily = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const report = await tauri.getDailyEntries(date);
      setDailyReport(report);
    } catch (err) {
      console.error("Failed to fetch daily report:", err);
      setDailyReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeekly = useCallback(async (startDate: string) => {
    setLoading(true);
    try {
      const report = await tauri.getWeeklyEntries(startDate);
      setWeeklyReport(report);
    } catch (err) {
      console.error("Failed to fetch weekly report:", err);
      setWeeklyReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDaily(selectedDate);
  }, [selectedDate, fetchDaily]);

  useEffect(() => {
    fetchWeekly(selectedWeek);
  }, [selectedWeek, fetchWeekly]);

  const refresh = useCallback(() => {
    fetchDaily(selectedDate);
    fetchWeekly(selectedWeek);
  }, [selectedDate, selectedWeek, fetchDaily, fetchWeekly]);

  return {
    dailyReport,
    weeklyReport,
    selectedDate,
    setSelectedDate,
    selectedWeek,
    setSelectedWeek,
    loading,
    refresh,
  };
}
