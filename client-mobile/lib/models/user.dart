class User {
  final String id;
  final String email;
  final String planType;
  final int dailyUsage;
  final int? dailyLimit;
  final int? remainingBytes;

  User({
    required this.id,
    required this.email,
    required this.planType,
    required this.dailyUsage,
    this.dailyLimit,
    this.remainingBytes,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      planType: json['planType'] ?? 'FREE',
      dailyUsage: int.tryParse(json['dailyUsage'].toString()) ?? 0,
      dailyLimit: json['dailyLimit'],
      remainingBytes: json['remainingBytes'],
    );
  }
}

class Node {
  final String id;
  final String displayName;
  final String? countryCode;
  final String tier;
  final int latency;
  final int load;

  Node({
    required this.id,
    required this.displayName,
    this.countryCode,
    required this.tier,
    required this.latency,
    required this.load,
  });

  factory Node.fromJson(Map<String, dynamic> json) {
    return Node(
      id: json['id'] ?? '',
      displayName: json['displayName'] ?? '',
      countryCode: json['countryCode'],
      tier: json['tier'] ?? 'FREE',
      latency: json['latency'] ?? 0,
      load: json['load'] ?? 0,
    );
  }
}

class VPNConfig {
  final String type;
  final String server;
  final int port;
  final String? password;
  final String? method;
  final String? uuid;

  VPNConfig({
    required this.type,
    required this.server,
    required this.port,
    this.password,
    this.method,
    this.uuid,
  });

  factory VPNConfig.fromJson(Map<String, dynamic> json) {
    return VPNConfig(
      type: json['type'] ?? 'ss',
      server: json['server'] ?? '',
      port: json['port'] ?? 0,
      password: json['password'],
      method: json['method'],
      uuid: json['uuid'],
    );
  }
}
