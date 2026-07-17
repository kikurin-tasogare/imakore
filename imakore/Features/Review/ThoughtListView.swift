import SwiftData
import SwiftUI

struct ThoughtListView: View {
    @Query(sort: \ThoughtEntry.createdAt, order: .reverse)
    private var entries: [ThoughtEntry]

    var body: some View {
        Group {
            if entries.isEmpty {
                ContentUnavailableView {
                    Label("まだ思考はありません", systemImage: "text.bubble")
                } description: {
                    Text("「残す」から、今の気持ちをそのまま置いてみましょう。")
                }
            } else {
                List(entries) { entry in
                    NavigationLink {
                        ThoughtDetailView(entry: entry)
                    } label: {
                        ThoughtRow(entry: entry)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityHint("思考の詳細を開きます")
                    .listRowInsets(EdgeInsets(top: 14, leading: 20, bottom: 14, trailing: 16))
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("振り返る")
    }
}

private struct ThoughtRow: View {
    let entry: ThoughtEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(entry.body)
                .font(.body)
                .foregroundStyle(.primary)
                .lineLimit(5)
                .multilineTextAlignment(.leading)

            HStack(spacing: 6) {
                Text(entry.createdAt, format: .dateTime.year().month().day())
                Text(entry.createdAt, format: .dateTime.hour().minute())
            }
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    NavigationStack {
        ThoughtListView()
    }
    .modelContainer(for: ThoughtEntry.self, inMemory: true)
}
