//
//  APIConfig.swift
//  WriteScholar
//
//  API base URL per build configuration. Debug points at the local
//  backend on the host Mac; Release points at production.
//

import Foundation

enum APIConfig {
    /// Base URL for all API calls. Simulator can reach the host's
    /// localhost directly; physical devices need the Mac's LAN IP
    /// (override via the WS_API_URL key in Info.plist if needed).
    static let baseURL: URL = {
        // Allow override from Info.plist for LAN testing
        if let override = Bundle.main.object(forInfoDictionaryKey: "WS_API_URL") as? String,
           !override.isEmpty,
           let url = URL(string: override) {
            return url
        }
        #if DEBUG
        return URL(string: "http://localhost:3001/api")!
        #else
        return URL(string: "https://writescholar.com/api")!
        #endif
    }()
}
