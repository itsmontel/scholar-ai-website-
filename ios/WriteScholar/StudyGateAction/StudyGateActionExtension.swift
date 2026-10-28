//
//  StudyGateActionExtension.swift
//  StudyGateAction
//
//  Receives taps on the question screen's two answer buttons. All the
//  logic (checking the answer, opening the app, scheduling the relock)
//  lives in StudyGateEngine so it can be read in one place.
//

import ManagedSettings

final class StudyGateActionExtension: ShieldActionDelegate {

    override func handle(action: ShieldAction,
                         for application: ApplicationToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        completionHandler(StudyGateEngine.answer(action, for: .app(application)))
    }

    override func handle(action: ShieldAction,
                         for webDomain: WebDomainToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        completionHandler(StudyGateEngine.answer(action, for: .webDomain(webDomain)))
    }

    override func handle(action: ShieldAction,
                         for category: ActivityCategoryToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        // Study Mode never gates whole web categories, so this should not
        // be reached. Closing is the safe answer if it ever is.
        completionHandler(.close)
    }
}
