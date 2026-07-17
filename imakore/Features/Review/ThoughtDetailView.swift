import SwiftData
import SwiftUI

struct ThoughtDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    let entry: ThoughtEntry

    @State private var isEditing = false
    @State private var isShowingDeleteConfirmation = false
    @State private var deleteError: Error?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                Text(entry.body)
                    .font(.body)
                    .lineSpacing(5)
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityLabel("思考の内容")

                Divider()

                VStack(alignment: .leading, spacing: 6) {
                    Text("残した日時")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(entry.createdAt, format: .dateTime.year().month().day().weekday().hour().minute())
                        .font(.subheadline)
                }

                Button("削除", role: .destructive) {
                    isShowingDeleteConfirmation = true
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityHint("確認後、この思考を削除します")
            }
            .padding(20)
        }
        .navigationTitle("思考")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("編集") {
                    isEditing = true
                }
                .accessibilityHint("思考の内容を編集します")
            }
        }
        .sheet(isPresented: $isEditing) {
            EditThoughtView(entry: entry)
        }
        .confirmationDialog("この思考を削除しますか？", isPresented: $isShowingDeleteConfirmation, titleVisibility: .visible) {
            Button("削除", role: .destructive, action: deleteThought)
            Button("キャンセル", role: .cancel) {}
        } message: {
            Text("削除した思考は元に戻せません。")
        }
        .alert("削除できませんでした", isPresented: Binding(
            get: { deleteError != nil },
            set: { if !$0 { deleteError = nil } }
        )) {
            Button("閉じる", role: .cancel) {}
        } message: {
            Text("少し時間をおいて、もう一度お試しください。")
        }
    }

    private func deleteThought() {
        modelContext.delete(entry)

        do {
            try modelContext.save()
            dismiss()
        } catch {
            modelContext.rollback()
            deleteError = error
        }
    }
}
