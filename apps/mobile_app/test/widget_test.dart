
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:mobile_app/main.dart';

void main() {
  testWidgets('MusclesMaster login screen test',
      (WidgetTester tester) async {
    await tester.pumpWidget(const MusclesMasterApp());

    expect(find.text('MusclesMaster'), findsOneWidget);
    expect(find.text('Login to your account'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);

    expect(find.byType(TextFormField), findsNWidgets(2));
  });
}
