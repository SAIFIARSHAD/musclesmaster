import 'package:material_ui/material_ui.dart';

class MemberDashboard extends StatelessWidget {
  final String userName;
  final String branchName;
  final String branchId;
  final VoidCallback onLogout;

  const MemberDashboard({
    super.key,
    required this.userName,
    required this.onLogout,
    this.branchName = 'Branch not assigned',
    this.branchId = 'N/A',
  });

  static const Color _navy = Color(0xFF07111D);
  static const Color _navyLight = Color(0xFF102438);
  static const Color _orange = Color(0xFFF4510B);
  static const Color _orangeLight = Color(0xFFFF762D);
  static const Color _textMuted = Color(0xFFADB9C8);
  static const Color _cardBorder = Color(0xFF26394B);

  String get _firstName {
    final name = userName.trim();
    if (name.isEmpty) return 'Member';
    return name.split(' ').first;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _navy,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildTopBar(context),
              _buildHero(),
              _buildBranchCard(),
              const SizedBox(height: 16),
              _buildMembershipCard(),
              const SizedBox(height: 16),
              _buildAttendanceCard(context),
              const SizedBox(height: 16),
              _buildPlansSection(context),
              const SizedBox(height: 22),
              _buildQuickActions(context),
              const SizedBox(height: 18),
              _buildTrainerCard(context),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNavigation(context),
    );
  }

  // ---------------------------------------------------------
  // TOP BAR
  // ---------------------------------------------------------

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
      child: Row(
        children: [
          Container(
            height: 42,
            width: 42,
            decoration: BoxDecoration(
              color: _orange,
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.fitness_center_rounded,
              color: Colors.white,
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'MusclesMaster AI',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white,
                fontSize: 19,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.4,
              ),
            ),
          ),
          IconButton(
            onPressed: () => _showMessage(context, 'Notifications'),
            icon: const Icon(
              Icons.notifications_none_rounded,
              color: Colors.white,
              size: 26,
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: onLogout,
            borderRadius: BorderRadius.circular(30),
            child: Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: _navyLight,
                shape: BoxShape.circle,
                border: Border.all(color: _orange, width: 1.5),
              ),
              child: const Icon(
                Icons.person_rounded,
                color: Colors.white,
                size: 25,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // HERO
  // ---------------------------------------------------------

  Widget _buildHero() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 28),
      child: Stack(
        children: [
          Positioned(
            right: -28,
            top: 0,
            bottom: 0,
            child: Container(
              width: 190,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _navy.withValues(alpha: 0),
                    _orange.withValues(alpha: 0.20),
                    _orange.withValues(alpha: 0.05),
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ),
          Positioned(
            right: 5,
            top: 5,
            child: Icon(
              Icons.fitness_center_rounded,
              size: 135,
              color: Colors.white.withValues(alpha: 0.055),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back,',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.90),
                  fontSize: 23,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '$_firstName!',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: _orangeLight,
                  fontSize: 34,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.7,
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: 245,
                child: Text(
                  'Keep pushing. Your stronger self is closer than you think.',
                  style: TextStyle(
                    color: _textMuted,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ),
              const SizedBox(height: 15),
              Container(
                height: 4,
                width: 105,
                decoration: BoxDecoration(
                  color: _orange,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // BRANCH CARD
  // ---------------------------------------------------------

  Widget _buildBranchCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _navyLight.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: _orange.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(
              Icons.location_on_rounded,
              color: _orangeLight,
              size: 29,
            ),
          ),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  branchName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Branch ID: $branchId',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: _textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.arrow_forward_ios_rounded,
            color: _orangeLight,
            size: 16,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // MEMBERSHIP
  // ---------------------------------------------------------

  Widget _buildMembershipCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF182A3B), Color(0xFF132438), Color(0xFF5A260F)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        children: [
          Container(
            height: 54,
            width: 54,
            decoration: BoxDecoration(
              color: _orange.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.workspace_premium_rounded,
              color: Color(0xFFFFB52E),
              size: 34,
            ),
          ),
          const SizedBox(width: 13),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'My Membership',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 7),
                Text(
                  'View your membership status',
                  style: TextStyle(color: _textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.arrow_forward_rounded,
            color: _orangeLight,
            size: 22,
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // ATTENDANCE
  // ---------------------------------------------------------

  Widget _buildAttendanceCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _navyLight.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(
                Icons.calendar_month_rounded,
                color: _orangeLight,
                size: 25,
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Attendance',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => _showMessage(context, 'Attendance history'),
                child: const Text(
                  'View History',
                  style: TextStyle(
                    color: _orangeLight,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                flex: 4,
                child: Column(
                  children: [
                    Container(
                      height: 100,
                      width: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: _orange, width: 8),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.qr_code_2_rounded,
                            color: _orangeLight,
                            size: 30,
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Check-in',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Scan at your gym',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: _textMuted, fontSize: 10),
                    ),
                  ],
                ),
              ),
              Container(width: 1, height: 115, color: _cardBorder),
              const SizedBox(width: 15),
              Expanded(
                flex: 6,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _attendanceInfo(
                      icon: Icons.check_circle_rounded,
                      iconColor: const Color(0xFF39D353),
                      title: 'Last Visit',
                      subtitle: 'View your recent attendance',
                    ),
                    const SizedBox(height: 18),
                    _attendanceInfo(
                      icon: Icons.access_time_filled_rounded,
                      iconColor: _orangeLight,
                      title: 'Next Check-in',
                      subtitle: 'Ready for your next session',
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () =>
                  _showMessage(context, 'QR check-in will open here'),
              icon: const Icon(Icons.qr_code_scanner_rounded, size: 19),
              label: const Text('Scan In'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _orangeLight,
                side: const BorderSide(color: _orange),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _attendanceInfo({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: iconColor, size: 22),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  color: _textMuted,
                  fontSize: 10,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------
  // WORKOUT AND DIET PLAN
  // ---------------------------------------------------------

  Widget _buildPlansSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _buildPlanCard(
              context,
              icon: Icons.fitness_center_rounded,
              title: 'Your Workout Plan',
              subtitle: 'View your assigned workout',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildPlanCard(
              context,
              icon: Icons.restaurant_rounded,
              title: 'Your Diet Plan',
              subtitle: 'View your nutrition plan',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      height: 172,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A2C3E), Color(0xFF0B1927)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: _orangeLight, size: 27),
          const SizedBox(height: 10),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 5),
          Expanded(
            child: Text(
              subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: _textMuted,
                fontSize: 11,
                height: 1.4,
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            height: 34,
            child: ElevatedButton(
              onPressed: () => _showMessage(context, title),
              style: ElevatedButton.styleFrom(
                backgroundColor: _orange,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: const Text(
                'View Plan  →',
                maxLines: 1,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // QUICK ACTIONS
  // ---------------------------------------------------------

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      (icon: Icons.event_available_rounded, title: 'Book Session'),
      (icon: Icons.person_rounded, title: 'Consult PT'),
      (icon: Icons.trending_up_rounded, title: 'Track Progress'),
      (icon: Icons.local_drink_rounded, title: 'Supplements'),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.bolt_rounded, color: _orangeLight, size: 25),
              SizedBox(width: 8),
              Text(
                'Quick Actions',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: actions.map((action) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: InkWell(
                    onTap: () => _showMessage(context, action.title),
                    borderRadius: BorderRadius.circular(17),
                    child: Container(
                      height: 100,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: _navyLight,
                        borderRadius: BorderRadius.circular(17),
                        border: Border.all(color: _cardBorder),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(action.icon, color: _orangeLight, size: 27),
                          const SizedBox(height: 9),
                          Text(
                            action.title,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // TRAINER CARD
  // ---------------------------------------------------------

  Widget _buildTrainerCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _navyLight.withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: _cardBorder),
      ),
      child: Row(
        children: [
          Container(
            height: 62,
            width: 62,
            decoration: BoxDecoration(
              color: const Color(0xFF26384A),
              shape: BoxShape.circle,
              border: Border.all(color: _orange.withValues(alpha: 0.5)),
            ),
            child: const Icon(
              Icons.person_rounded,
              color: Colors.white,
              size: 38,
            ),
          ),
          const SizedBox(width: 13),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your Personal Trainer',
                  style: TextStyle(color: _textMuted, fontSize: 11),
                ),
                SizedBox(height: 5),
                Text(
                  'Trainer details',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 5),
                Text(
                  'Connect with your trainer',
                  style: TextStyle(color: _textMuted, fontSize: 10),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: () => _showMessage(context, 'Trainer chat'),
            style: OutlinedButton.styleFrom(
              foregroundColor: _orangeLight,
              side: const BorderSide(color: _orange),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(22),
              ),
            ),
            child: const Text(
              'Chat  →',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // BOTTOM NAVIGATION
  // ---------------------------------------------------------

  Widget _buildBottomNavigation(BuildContext context) {
    final items = [
      (icon: Icons.home_rounded, title: 'Home'),
      (icon: Icons.fitness_center_rounded, title: 'Workouts'),
      (icon: Icons.calendar_month_rounded, title: 'Attendance'),
      (icon: Icons.workspace_premium_rounded, title: 'Membership'),
      (icon: Icons.person_outline_rounded, title: 'Profile'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0B1B2A),
        border: Border(
          top: BorderSide(color: _cardBorder.withValues(alpha: 0.8)),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 10, 8, 8),
          child: Row(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              final selected = index == 0;

              return Expanded(
                child: InkWell(
                  onTap: selected
                      ? null
                      : () => _showMessage(context, item.title),
                  borderRadius: BorderRadius.circular(14),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          item.icon,
                          color: selected ? _orangeLight : _textMuted,
                          size: 23,
                        ),
                        const SizedBox(height: 5),
                        Text(
                          item.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: selected ? _orangeLight : _textMuted,
                            fontSize: 9,
                            fontWeight: selected
                                ? FontWeight.w800
                                : FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Container(
                          height: 3,
                          width: selected ? 32 : 0,
                          decoration: BoxDecoration(
                            color: _orange,
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------
  // MESSAGE HELPER
  // ---------------------------------------------------------

  void _showMessage(BuildContext context, String section) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$section section will be connected here.'),
        backgroundColor: _navyLight,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
