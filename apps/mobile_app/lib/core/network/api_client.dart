
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  ApiClient._();

  // Local development API URL
  static const String baseUrl = 'http://192.168.0.135:5000/api/';

  static const String accessTokenKey = 'mm_access_token';
  static const String userNameKey = 'mm_user_name';
  static const String userRoleKey = 'mm_user_role';

  static const FlutterSecureStorage _storage =
      FlutterSecureStorage();

  static final Dio dio = _createDio();

  static Dio _createDio() {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        sendTimeout: const Duration(seconds: 15),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(
            key: accessTokenKey,
          );

          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] =
                'Bearer $token';
          }

          handler.next(options);
        },

        onError: (error, handler) {
          final apiError = ApiException.fromDio(error);

          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: error.type,
              error: apiError,
              message: apiError.message,
            ),
          );
        },
      ),
    );

    return dio;
  }

  // Save access token after successful login
  static Future<void> saveAccessToken(
    String token,
  ) async {
    await _storage.write(
      key: accessTokenKey,
      value: token,
    );
  }

// Save logged-in user's name
static Future<void> saveUserName(String name) async {
  await _storage.write(
    key: userNameKey,
    value: name,
  );
}

// Read saved user's name
static Future<String?> getUserName() async {
  return await _storage.read(
    key: userNameKey,
  );
}

// Remove saved user name
static Future<void> clearUserName() async {
  await _storage.delete(
    key: userNameKey,
  );
}


  // Save logged-in user's role
  static Future<void> saveUserRole(String role) async {
    await _storage.write(
      key: userRoleKey,
      value: role,
    );
  }

  // Read saved user's role
  static Future<String?> getUserRole() async {
    return await _storage.read(
      key: userRoleKey,
    );
  }

  // Remove saved user's role
  static Future<void> clearUserRole() async {
    await _storage.delete(
      key: userRoleKey,
    );
  }


  // Read stored access token
  static Future<String?> getAccessToken() async {
    return await _storage.read(
      key: accessTokenKey,
    );
  }

  // Remove token during logout
  static Future<void> clearAccessToken() async {
    await _storage.delete(
      key: accessTokenKey,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException({
    required this.message,
    this.statusCode,
  });

  factory ApiException.fromDio(DioException error) {
    final response = error.response;
    final statusCode = response?.statusCode;

    String message = 'Something went wrong. Please try again.';

    final data = response?.data;

    if (data is Map) {
      final serverMessage =
          data['message'] ?? data['error'];

      if (serverMessage is String &&
          serverMessage.trim().isNotEmpty) {
        message = serverMessage;
      }
    }

    if (response == null) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          message = 'Connection timed out. Please try again.';
          break;

        case DioExceptionType.connectionError:
          message =
              'Unable to connect to server. Check your Wi-Fi '
              'and make sure the backend is running.';
          break;

        default:
          message = 'Network error. Please try again.';
      }
    } else if (statusCode == 401) {
      message = 'Unauthorized. Please check your credentials '
          'or login again.';
    } else if (statusCode == 403) {
      message = 'You do not have permission to perform this action.';
    } else if (statusCode == 404) {
      message = 'Requested resource was not found.';
    } else if (statusCode != null && statusCode >= 500) {
      message = 'Server error. Please try again later.';
    }

    // Prefer the backend's message when it provides one.
    if (data is Map) {
      final serverMessage =
          data['message'] ?? data['error'];

      if (serverMessage is String &&
          serverMessage.trim().isNotEmpty) {
        message = serverMessage;
      }
    }

    return ApiException(
      message: message,
      statusCode: statusCode,
    );
  }

  @override
  String toString() => message;
}
