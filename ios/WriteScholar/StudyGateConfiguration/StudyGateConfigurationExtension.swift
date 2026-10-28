//
//  StudyGateConfigurationExtension.swift
//  StudyGateConfiguration
//
//  Draws the question screen iOS shows when someone opens an app while
//  Study Mode is on. Apple's screen allows an icon, a title, a subtitle
//  and two buttons, so a question is always a prompt plus two answers:
//  option 0 on the primary button, option 1 on the secondary one.
//  StudyGateEngine.answer relies on that order.
//
//  iOS calls this again whenever the action extension returns `.defer`,
//  which is how a wrong answer turns into feedback plus the next question.
//

import ManagedSettings
import ManagedSettingsUI
import UIKit

final class StudyGateConfigurationExtension: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        StudyGateScreen.make(opening: application.localizedDisplayName)
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        StudyGateScreen.make(opening: application.localizedDisplayName)
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        StudyGateScreen.make(opening: webDomain.domain)
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        StudyGateScreen.make(opening: webDomain.domain)
    }
}

private enum StudyGateScreen {

    // WriteScholar palette (WSColor in the app; the extension can't see it).
    // Computed so strict concurrency has no shared UIColor statics to flag.
    static var background: UIColor { UIColor(red: 0xF6 / 255, green: 0xF4 / 255, blue: 0xFE / 255, alpha: 1) }
    static var ink: UIColor { UIColor(red: 0x3C / 255, green: 0x3C / 255, blue: 0x3C / 255, alpha: 1) }
    static var muted: UIColor { UIColor(red: 0x5E / 255, green: 0x5A / 255, blue: 0x6E / 255, alpha: 1) }
    static var purple: UIColor { UIColor(red: 0x7C / 255, green: 0x5C / 255, blue: 0xE6 / 255, alpha: 1) }
    static var purpleDark: UIColor { UIColor(red: 0x62 / 255, green: 0x46 / 255, blue: 0xC9 / 255, alpha: 1) }

    static func make(opening name: String?) -> ShieldConfiguration {
        let appName = (name?.isEmpty == false) ? name! : "this app"

        guard let question = StudyModeStore.currentQuestion() else {
            // Only possible before WriteScholar has built a deck. The
            // action extension lets them straight through.
            return ShieldConfiguration(
                backgroundBlurStyle: nil,
                backgroundColor: background,
                icon: UIImage(named: "gate-mascot"),
                title: .init(text: "Study Mode is warming up", color: ink),
                subtitle: .init(text: "Open WriteScholar once so it can load questions from your study packs.", color: muted),
                primaryButtonLabel: .init(text: "Continue to \(appName)", color: .white),
                primaryButtonBackgroundColor: purple,
                secondaryButtonLabel: nil
            )
        }

        var subtitle = ""
        if let fb = StudyModeStore.recentFeedback, !fb.wasCorrect {
            subtitle += "Not quite, it was \u{201C}\(fb.correctAnswer)\u{201D}. Try this one:\n\n"
        }
        subtitle += question.prompt
        let right = StudyModeStore.todayStats.right
        subtitle += "\n\nFrom \(question.source)"
        if right > 0 {
            subtitle += " · \(right) right today"
        }

        return ShieldConfiguration(
            backgroundBlurStyle: nil,
            backgroundColor: background,
            icon: UIImage(named: "gate-mascot"),
            title: .init(text: "Answer to open \(appName)", color: ink),
            subtitle: .init(text: subtitle, color: muted),
            primaryButtonLabel: .init(text: question.options[0], color: .white),
            primaryButtonBackgroundColor: purple,
            secondaryButtonLabel: .init(text: question.options[1], color: purpleDark)
        )
    }
}
