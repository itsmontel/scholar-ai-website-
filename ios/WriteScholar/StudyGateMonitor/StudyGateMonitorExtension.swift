//
//  StudyGateMonitorExtension.swift
//  StudyGateMonitor
//
//  iOS wakes this when an unlock timer scheduled by
//  StudyGateEngine.scheduleRelock ends, even if WriteScholar is closed.
//  Re-applying the gate drops the expired unlock, so the app asks a
//  question again next time it is opened.
//

import DeviceActivity

final class StudyGateMonitorExtension: DeviceActivityMonitor {

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        guard activity.rawValue.hasPrefix(StudyGateEngine.relockPrefix) else { return }
        StudyGateEngine.apply()
        DeviceActivityCenter().stopMonitoring([activity])
    }
}
