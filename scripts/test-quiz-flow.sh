#!/bin/bash
# Answer all 20 questions: mix of correct/wrong to land on B1 (60%)
# Correct: 1-8, wrong: 9-12, correct: 13-16, wrong: 17-20

declare -a ANSWERS=(
  "a cat" "am" "The sun" "Yellow"           # A1 correct
  "go" "It's rainy" "played" "Small"        # A2 correct
  "would" "for" "very bad" "She reads books" # B1 wrong
  "will have completed" "unwilling and hesitant" "was reviewed" "It was delayed" # B2 correct
  "extremely rare" "had" "to eat very quickly" "took" # C1 wrong
)

for i in "${!ANSWERS[@]}"; do
  ans="${ANSWERS[$i]}"
  agent-browser find text "$ans" click >/dev/null 2>&1
  sleep 0.7
  if [ $i -eq 19 ]; then
    agent-browser find text "🎁 شاهد نتيجتك!" click >/dev/null 2>&1
  else
    agent-browser find text "التالي ←" click >/dev/null 2>&1
  fi
  sleep 0.8
done
echo "DONE - all 20 answered"
