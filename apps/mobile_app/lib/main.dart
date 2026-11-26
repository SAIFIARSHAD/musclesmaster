
import 'package:material_ui/material_ui.dart';
import 'package:dio/dio.dart';

import 'core/network/api_client.dart';
import 'features/member/member_dashboard.dart';
import 'features/trainer/trainer_dashboard.dart';

void main() {
  runApp(const MusclesMasterApp());
}

class MusclesMasterApp extends StatelessWidget {
  const MusclesMasterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MusclesMaster',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
        ),
        useMaterial3: true,
      ),
      home: const LoginScreen(),
    );
  }
}

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _isCheckingAuth = true;

  String? _loggedInUser;
  String? _loggedInUserRole;
  String? _authCheckError;

  @override
  void initState() {
    super.initState();
    _checkExistingSession();
  }

  // CHECK EXISTING SESSION
  Future<void> _checkExistingSession() async {
    if (!mounted) return;

    setState(() {
      _isCheckingAuth = true;
      _authCheckError = null;
    });

    try {
      final token = await ApiClient.getAccessToken();

      // No saved token: show login screen
      if (token == null || token.isEmpty) {
        if (!mounted) return;

        setState(() {
          _loggedInUser = null;
          _loggedInUserRole = null;
          _isCheckingAuth = false;
        });

        return;
      }

      // Verify saved token with protected API
      final response = await ApiClient.dio.get(
        'auth/sessions',
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        final savedUserName = await ApiClient.getUserName();
        final savedUserRole = await ApiClient.getUserRole();

        if (!mounted) return;

        setState(() {
          _loggedInUser = savedUserName ?? 'User';
          _loggedInUserRole = savedUserRole?.toUpperCase();
          _isCheckingAuth = false;
        });
      } else {
        setState(() {
          _loggedInUser = null;
          _loggedInUserRole = null;
          _isCheckingAuth = false;
        });
      }
    } on DioException catch (error) {
      if (!mounted) return;

      final statusCode = error.response?.statusCode;

      if (statusCode == 401) {
        // Token is no longer accepted
        await ApiClient.clearAccessToken();
        await ApiClient.clearUserName();
        await ApiClient.clearUserRole();

        if (!mounted) return;

        setState(() {
          _loggedInUser = null;
          _loggedInUserRole = null;
          _authCheckError = null;
          _isCheckingAuth = false;
        });
      } else {
        // Network/server error: don't delete token
        setState(() {
          _authCheckError =
              'Unable to verify your session. Please try again.';
          _isCheckingAuth = false;
        });
      }
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _authCheckError =
            'Something went wrong while checking your session.';
        _isCheckingAuth = false;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  // LOGIN API
  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiClient.dio.post(
        'auth/login',
        data: {
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        },
      );

      final responseData = response.data;

      Map<String, dynamic>? payload;

      if (responseData is Map) {
        payload = Map<String, dynamic>.from(responseData);

        // Handle response wrapped inside "data"
        if (payload['data'] is Map) {
          payload = Map<String, dynamic>.from(
            payload['data'] as Map,
          );
        }
      }

      final token = payload?['accessToken'] ??
          payload?['access_token'] ??
          payload?['token'];

      if (token is! String || token.isEmpty) {
        throw Exception(
          'Login response received, but access token was not found.',
        );
      }

      // Save access token securely
      await ApiClient.saveAccessToken(token);

      final userData = payload?['user'];

      String userName = 'User';

      if (userData is Map) {
        userName = userData['name']?.toString() ??
            userData['email']?.toString() ??
            'User';
      }

      await ApiClient.saveUserName(userName);

      // Get user's role from login response
      final userRole = userData is Map
          ? (
              userData['role'] ??
              userData['userRole']
            )?.toString().toUpperCase()
          : null;

      // Save user's role securely
      if (userRole != null && userRole.isNotEmpty) {
        await ApiClient.saveUserRole(userRole);
      } else {
        await ApiClient.clearUserRole();
      }

      if (!mounted) return;

      setState(() {
        _loggedInUser = userName;
        _loggedInUserRole = userRole;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login successful!'),
          backgroundColor: Colors.green,
        ),
      );
    } on DioException catch (error) {
      if (!mounted) return;

      final apiError = error.error;

      final message = apiError is ApiException
          ? apiError.message
          : error.message ?? 'Login failed. Please try again.';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
        ),
      );
    } catch (error) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString()),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // LOGOUT
  Future<void> _logout() async {
    await ApiClient.clearAccessToken();
    await ApiClient.clearUserName();
    await ApiClient.clearUserRole();

    if (!mounted) return;

    setState(() {
      _loggedInUser = null;
      _loggedInUserRole = null;
      _passwordController.clear();
      _authCheckError = null;
    });
  }

  // ROLE-BASED DASHBOARD
  Widget _buildRoleDashboard() {
    final role = _loggedInUserRole?.toUpperCase();
    final userName = _loggedInUser ?? 'User';

    if (role == 'MEMBER') {
      return MemberDashboard(
        userName: userName,
        onLogout: _logout,
      );
    }

    if (role == 'TRAINER') {
      return TrainerDashboard(
        userName: userName,
        onLogout: _logout,
      );
    }

    // Role missing or not supported in current mobile app
    return Scaffold(
      appBar: AppBar(
        title: const Text('MusclesMaster'),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.warning_amber_rounded,
                size: 56,
                color: Colors.orange,
              ),
              const SizedBox(height: 16),
              const Text(
                'Dashboard not available',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                role == null || role.isEmpty
                    ? 'Your account role was not found. Please login again.'
                    : 'The "$role" role is not supported in this app yet.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _logout,
                child: const Text('Logout'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = _loggedInUser != null;

    // Dashboards have their own Scaffold.
    // Return them directly to avoid nested Scaffold layouts.
    if (!_isCheckingAuth &&
        _authCheckError == null &&
        isLoggedIn) {
      return _buildRoleDashboard();
    }

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: 420,
              ),
              child: _isCheckingAuth
                  ? const Center(
                      child: CircularProgressIndicator(),
                    )
                  : _authCheckError != null
                      ? Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.wifi_off,
                              size: 48,
                              color: Colors.grey,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _authCheckError!,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: _checkExistingSession,
                              child: const Text('Retry'),
                            ),
                          ],
                        )
                      : _buildLoginForm(),
            ),
          ),
        ),
      ),
    );
  }

  // LOGIN FORM
  Widget _buildLoginForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(
            Icons.fitness_center,
            size: 64,
            color: Color(0xFF4F46E5),
          ),
          const SizedBox(height: 20),
          const Text(
            'MusclesMaster',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Login to your account',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 32),

          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email_outlined),
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Please enter your email';
              }

              if (!value.contains('@')) {
                return 'Please enter a valid email';
              }

              return null;
            },
          ),

          const SizedBox(height: 16),

          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _login(),
            decoration: InputDecoration(
              labelText: 'Password',
              prefixIcon: const Icon(Icons.lock_outline),
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                onPressed: () {
                  setState(() {
                    _obscurePassword = !_obscurePassword;
                  });
                },
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_off
                      : Icons.visibility,
                ),
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your password';
              }

              return null;
            },
          ),

          const SizedBox(height: 24),

          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _login,
              child: _isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                      ),
                    )
                  : const Text(
                      'Login',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
