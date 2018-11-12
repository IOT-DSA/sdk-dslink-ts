// part of dslink.historian;

export class GetHistoryNode  extends SimpleNode {
  GetHistoryNode(path: string) : super(path, this._link.provider) {
    configs[r"$is"] = "getHistory";
    configs[r"$name"] = "Get History";
    configs[r"$invokable"] = "read";
    configs[r"$params"] = [
      {
        "name": "Timerange",
        "type": "string",
        "editor": "daterange"
      },
      {
        "name": "Interval",
        "type": "enum",
        "editor": buildEnumType([
          "default",
          "none",
          "1Y",
          "3N",
          "1N",
          "1W",
          "1D",
          "12H",
          "6H",
          "4H",
          "3H",
          "2H",
          "1H",
          "30M",
          "15M",
          "10M",
          "5M",
          "1M",
          "30S",
          "15S",
          "10S",
          "5S",
          "1S"
        ]),
        "default": "default"
      },
      {
        "name": "Rollup",
        "type": buildEnumType([
          "none",
          "avg",
          "min",
          "max",
          "sum",
          "first",
          "last",
          "count"
        ])
      },
      {
        "name": "Real Time",
        "type": "boolean",
        "default": false
      },
      {
        "name": "Batch Size",
        "type": "number",
        "default": 0
      }
    ];

    configs[r"$columns"] = [
      {
        "name": "timestamp",
        "type": "time"
      },
      {
        "name": "value",
        "type": "dynamic"
      }
    ];

    configs[r"$result"] = "stream";
  }

  @override
  onInvoke(params: {[key: string]: dynamic}) async* {
    range: string = params["Timerange"];
    rollupName: string = params["Rollup"];
    rollupFactory: RollupFactory = _rollups[rollupName];
    rollup: Rollup = rollupFactory == null ? null : rollupFactory();
    interval: Duration = new Duration(
      milliseconds: parseInterval(params["Interval"]));
    batchSize: num = params["Batch Size"];

    if (batchSize == null) {
      batchSize = 0;
    }

    batchCount: int = batchSize.toInt();

    tr: TimeRange = parseTimeRange(range);
    if (params["Real Time"] == true) {
      tr = new TimeRange(tr.start, null);
    }

    try {
      let pairs: Stream<ValuePair> = await calculateHistory(
        tr,
        interval,
        rollup
      );

      if (params["Real Time"] == true) {
        await for (ValuePair pair in pairs) {
          yield [pair.toRow()];
        }
      } else {
        let count: int = 0;
        List<dynamic[]> buffer = [];

        await for (ValuePair row in pairs) {
          count++;
          buffer.add(row.toRow());
          if (count != 0 && count == batchCount) {
            yield buffer;
            buffer = [];
            count = 0;
          }
        }

        if (buffer.isNotEmpty) {
          yield buffer;
          buffer.length = 0;
        }
      }
    } catch (e) {
      rethrow;
    }
  }

  fetchHistoryData(range: TimeRange):Stream<ValuePair> {
    var p = new Path(path);
    var mn = p.parent;
    pn: WatchPathNode = _link[mn.path];

    return pn.fetchHistory(range);
  }

  Stream<ValuePair> calculateHistory(range: TimeRange,
    interval: Duration,
    rollup: Rollup) async* {
    if (interval.inMilliseconds <= 0) {
      yield* fetchHistoryData(range);
      return;
    }

    lastTimestamp: int = -1;
    totalTime: int = 0;

    result: ValuePair;

    await for (ValuePair pair in fetchHistoryData(range)) {
      rollup.add(pair.value);
      if (lastTimestamp != -1) {
        totalTime += pair.time.millisecondsSinceEpoch - lastTimestamp;
      }
      lastTimestamp = pair.time.millisecondsSinceEpoch;
      if (totalTime >= interval.inMilliseconds) {
        totalTime = 0;
        result = new ValuePair(
          new DateTime.fromMillisecondsSinceEpoch(
            lastTimestamp
          ).toIso8601String(),
          rollup.value
        );
        yield result;
        result = null;
        rollup.reset();
      }
    }

    if (result != null) {
      yield result;
    }
  }
}
